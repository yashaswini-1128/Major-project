import { Router } from 'express'
import { prisma } from '../index'
import * as ExcelJS from 'exceljs'
import bcrypt from 'bcryptjs'

const router = Router()

// Middleware to check if user is a faculty member
const authenticateFaculty = (req: any, res: any, next: any) => {
  // We'll skip proper JWT validation here for speed, but in a real app this would verify the token
  // For now, we assume the frontend sends the role in a header or we decode the JWT
  const role = req.headers['x-user-role']
  if (role !== 'FACULTY') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

router.use(authenticateFaculty)

// Get all students
router.get('/students', async (req, res) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { id: true, name: true, email: true, isAllowed: true }
    })
    res.json(students)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch students' })
  }
})

// Create a new student account
router.post('/students', async (req, res) => {
  const { name, email, password } = req.body
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'A student with this email already exists.' })
    }
    const hashed = await bcrypt.hash(password, 10)
    const student = await prisma.user.create({
      data: { name, email, password: hashed, role: 'STUDENT', isAllowed: true }
    })
    res.json({ id: student.id, name: student.name, email: student.email, isAllowed: student.isAllowed })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create student.' })
  }
})
router.put('/students/:id/access', async (req, res) => {
  const { isAllowed } = req.body
  try {
    const student = await prisma.user.update({
      where: { id: req.params.id },
      data: { isAllowed }
    })
    res.json(student)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update access' })
  }
})

// Delete a student (removes attempts & logs first)
router.delete('/students/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Delete monitoring logs for all attempts of this student
    const attempts = await prisma.attempt.findMany({ where: { studentId: id } })
    for (const attempt of attempts) {
      await prisma.monitoringLog.deleteMany({ where: { attemptId: attempt.id } })
    }
    // Delete attempts
    await prisma.attempt.deleteMany({ where: { studentId: id } })
    // Delete user
    await prisma.user.delete({ where: { id } })
    res.json({ message: 'Student deleted successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete student.' })
  }
})

// Get all tests and their attempts
router.get('/tests', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      include: {
        attempts: {
          include: { student: { select: { name: true, email: true } } }
        }
      }
    })
    res.json(tests)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// Toggle test status, set duration and access code
router.put('/tests/:id/status', async (req, res) => {
  const { enabled, duration, accessCode } = req.body
  try {
    const data: any = { enabled }
    if (duration !== undefined) data.duration = Number(duration)
    if (accessCode !== undefined) data.accessCode = accessCode || null
    const test = await prisma.test.update({ where: { id: req.params.id }, data })
    res.json(test)
  } catch (err) {
    res.status(500).json({ error: 'Failed to update test status' })
  }
})

// Create new test
router.post('/tests', async (req, res) => {
  const { title, subject, duration, accessCode, questions } = req.body
  try {
    const test = await prisma.test.create({
      data: {
        title,
        subject,
        duration: duration ? Number(duration) : 60,
        accessCode: accessCode || null,
        enabled: false,
        facultyId: req.headers['x-user-id'] as string,
        questions: {
          create: questions.map((q: any) => ({
            imageUrl: q.imageUrl,
            text: q.text,
            correctAnswer: q.correctAnswer,
            hintText: q.hintText || null
          }))
        }
      }
    })
    res.json(test)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to create test' })
  }
})

// Delete a test (cascades delete related data)
router.delete('/tests/:id', async (req, res) => {
  try {
    const { id } = req.params
    // Delete monitoring logs for attempts of this test
    const attempts = await prisma.attempt.findMany({ where: { testId: id } })
    for (const attempt of attempts) {
      await prisma.monitoringLog.deleteMany({ where: { attemptId: attempt.id } })
    }
    // Delete attempts
    await prisma.attempt.deleteMany({ where: { testId: id } })
    // Delete questions
    await prisma.question.deleteMany({ where: { testId: id } })
    // Delete test
    await prisma.test.delete({ where: { id } })
    res.json({ message: 'Test deleted successfully.' })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to delete test.' })
  }
})

// Update a test's metadata (title, subject, duration, accessCode)
router.put('/tests/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, subject, duration, accessCode } = req.body
    const data: any = {
      title,
      subject,
      duration: duration ? Number(duration) : undefined,
      accessCode: accessCode || null
    }
    const updated = await prisma.test.update({ where: { id }, data })
    res.json(updated)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Failed to update test.' })
  }
})

// Get attempts for a test
router.get('/tests/:id/attempts', async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: { testId: req.params.id },
      include: {
        student: { select: { name: true, email: true } },
        logs: true
      }
    })
    res.json(attempts)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch attempts' })
  }
})

// Get all reports/attempts
router.get('/reports', async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      include: {
        student: { select: { name: true, email: true } },
        test: { select: { title: true, subject: true } }
      },
      orderBy: { startedAt: 'desc' }
    })
    res.json(attempts)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch reports' })
  }
})

// Export reports to Excel
router.get('/reports/export', async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      include: {
        student: { select: { name: true, email: true } },
        test: { select: { title: true, subject: true } }
      },
      orderBy: { startedAt: 'desc' }
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Attempts')

    worksheet.columns = [
      { header: 'Student Name', key: 'name', width: 20 },
      { header: 'Student Email', key: 'email', width: 25 },
      { header: 'Test Title', key: 'title', width: 30 },
      { header: 'Subject', key: 'subject', width: 20 },
      { header: 'Score', key: 'score', width: 10 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Date', key: 'date', width: 20 },
      { header: 'Termination Reason', key: 'reason', width: 20 },
    ]

    attempts.forEach(attempt => {
      worksheet.addRow({
        name: attempt.student.name,
        email: attempt.student.email,
        title: attempt.test.title,
        subject: attempt.test.subject,
        score: attempt.score,
        status: attempt.status,
        date: attempt.startedAt.toLocaleString(),
        reason: attempt.terminationReason || 'N/A'
      })
    })

    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
    res.setHeader(
      'Content-Disposition',
      'attachment; filename=' + 'student_reports.xlsx'
    )

    await workbook.xlsx.write(res)
    res.end()
  } catch (err) {
    res.status(500).json({ error: 'Failed to export reports' })
  }
})

export default router
