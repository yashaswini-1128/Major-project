import { Router } from 'express'
import { prisma } from '../index'
import bcrypt from 'bcryptjs'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

const router = Router()

const authenticateStudent = (req: any, res: any, next: any) => {
  const role = req.headers['x-user-role']
  if (role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden' })
  }
  next()
}

router.use(authenticateStudent)

// Get available tests
router.get('/tests', async (req, res) => {
  try {
    const tests = await prisma.test.findMany({
      where: { enabled: true },
      select: { 
        id: true, 
        title: true, 
        subject: true,
        duration: true,
        faculty: { select: { name: true } }
      }
    })
    res.json(tests)
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tests' })
  }
})

// Verify access code without creating an attempt
router.post('/tests/:id/verify-code', async (req, res) => {
  const { accessCode } = req.body
  try {
    const test = await prisma.test.findUnique({ where: { id: req.params.id }, select: { accessCode: true } })
    if (!test) return res.status(404).json({ error: 'Test not found' })

    if (test.accessCode) {
      if (!accessCode || accessCode.trim() !== test.accessCode.trim()) {
        return res.status(403).json({ error: 'Invalid access code. Please check with your faculty.' })
      }
    }
    res.json({ valid: true })
  } catch (err) {
    res.status(500).json({ error: 'Failed to verify code' })
  }
})

// Get test details & questions (start attempt)
router.post('/tests/:id/attempt', async (req, res) => {
  const studentId = req.headers['x-user-id'] as string
  const { accessCode } = req.body

  try {
    // Fetch test first to validate access code
    const test = await prisma.test.findUnique({
      where: { id: req.params.id },
      include: {
        questions: { select: { id: true, imageUrl: true, text: true, hintText: true } },
        faculty: { select: { name: true } }
      }
    })

    if (!test) return res.status(404).json({ error: 'Test not found' })

    // Validate access code if one is set
    if (test.accessCode) {
      if (!accessCode || accessCode.trim() !== test.accessCode.trim()) {
        return res.status(403).json({ error: 'Invalid access code. Please check with your faculty.' })
      }
    }

    // Create an attempt
    const attempt = await prisma.attempt.create({
      data: { testId: req.params.id, studentId, status: 'IN_PROGRESS' }
    })

    res.json({ attempt, test })
  } catch (err) {
    res.status(500).json({ error: 'Failed to start attempt' })
  }
})

// Submit attempt
router.post('/attempts/:id/submit', async (req, res) => {
  const { answers } = req.body // Record<questionId, string>
  try {
    const attempt = await prisma.attempt.findUnique({ where: { id: req.params.id } })
    if (!attempt || attempt.status !== 'IN_PROGRESS') {
      return res.status(400).json({ error: 'Invalid attempt' })
    }

    const test = await prisma.test.findUnique({
      where: { id: attempt.testId },
      include: { questions: true }
    })

    if (!test) return res.status(404).json({ error: 'Test not found' })

    // Calculate score
    let score = 0
    test.questions.forEach(q => {
      if (answers[q.id]?.toLowerCase().trim() === q.correctAnswer.toLowerCase().trim()) {
        score++
      }
    })

    const updatedAttempt = await prisma.attempt.update({
      where: { id: req.params.id },
      data: {
        score,
        status: 'COMPLETED',
        submittedAt: new Date()
      }
    })

    res.json({ attempt: updatedAttempt, totalQuestions: test.questions.length })
  } catch (err) {
    res.status(500).json({ error: 'Failed to submit attempt' })
  }
})

// Change password
router.put('/change-password', async (req, res) => {
  const studentId = req.headers['x-user-id'] as string
  const { currentPassword, newPassword } = req.body

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ error: 'Both current and new passwords are required.' })
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'New password must be at least 6 characters.' })
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: studentId } })
    if (!user) return res.status(404).json({ error: 'User not found.' })

    const isValid = await bcrypt.compare(currentPassword, user.password)
    if (!isValid) return res.status(401).json({ error: 'Current password is incorrect.' })

    const hashed = await bcrypt.hash(newPassword, 10)
    await prisma.user.update({ where: { id: studentId }, data: { password: hashed } })

    res.json({ message: 'Password changed successfully.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password.' })
  }
})

// AI Hint — explains the concept without revealing the exact answer
router.post('/ai-hint', async (req, res) => {
  const { questionId, studentAnswer } = req.body

  try {
    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { text: true, correctAnswer: true, hintText: true }
    })
    if (!question) return res.status(404).json({ error: 'Question not found' })

    const prompt = `
You are an expert microbiology educator helping a student who gave a wrong answer in a practical lab assessment.

Question shown to student: "${question.text}"
Student's wrong answer: "${studentAnswer}"
Faculty hint (to also show separately): "${question.hintText || 'No hint provided'}"

Your task:
- Give a SHORT educational explanation (3-4 sentences max) that helps the student understand the CONCEPT behind this question.
- Explain what key features or characteristics they should be looking for.
- Do NOT reveal the correct answer directly. Do NOT repeat the question verbatim.
- Use indirect language like "In this type of specimen..." or "When examining this kind of sample..."
- Keep it friendly, encouraging, and educational.
- Do not include the word 'answer' or 'correct answer'.

Provide only the explanation text, no headers, no bullet points.`

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(prompt)
    const explanation = result.response.text()

    res.json({
      explanation: explanation.trim(),
      hint: question.hintText || null
    })
  } catch (err: any) {
    console.error('Gemini error:', err.message)
    res.status(500).json({ error: 'Failed to generate AI explanation.' })
  }
})

export default router
