import { Router } from 'express'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { prisma } from '../index'

const router = Router()

router.post('/login', async (req, res) => {
  const { name, email, password } = req.body

  if (!email) {
    return res.status(400).json({ error: 'Email is required.' })
  }

  try {
    let user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return res.status(401).json({ error: 'No account found with this email. Please register first.' })
    }

    if (user.role === 'STUDENT' && !user.isAllowed) {
      return res.status(403).json({ error: 'Access Denied - Contact Faculty' })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' })
    }

    // If student provides a name, update it in the DB
    if (user.role === 'STUDENT' && name && name.trim()) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: name.trim() }
      })
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    )

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Faculty self-registration
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    const user = await prisma.user.create({
      data: { name, email, password: hashed, role: 'FACULTY', isAllowed: true }
    })

    const token = jwt.sign(
      { id: user.id, role: user.role, email: user.email },
      process.env.JWT_SECRET || 'secret',
      { expiresIn: '1d' }
    )

    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email, role: user.role }
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Student self-registration (starts as pending — faculty must approve)
router.post('/student-register', async (req, res) => {
  const { name, email, password } = req.body

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email and password are required.' })
  }
  if (password.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters.' })
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return res.status(409).json({ error: 'An account with this email already exists.' })
    }

    const hashed = await bcrypt.hash(password, 10)
    await prisma.user.create({
      data: { name, email, password: hashed, role: 'STUDENT', isAllowed: true }
    })

    res.json({ message: 'Registration successful! Please wait for faculty approval before logging in.' })
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
