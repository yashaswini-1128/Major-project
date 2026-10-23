import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { PrismaClient } from '@prisma/client'
import multer from 'multer'
import path from 'path'
import fs from 'fs'

const uploadsDir = path.join(process.cwd(), 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir)
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage: storage })

dotenv.config()

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: {
    origin: '*',
  }
})

import authRouter from './routes/auth'
import facultyRouter from './routes/faculty'
import studentRouter from './routes/student'

export const prisma = new PrismaClient()

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRouter)
app.use('/api/faculty', facultyRouter)
app.use('/api/student', studentRouter)

app.use('/uploads', express.static(uploadsDir))

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' })
  }
  const PORT = process.env.PORT || 5000
  const imageUrl = `http://localhost:${PORT}/uploads/${req.file.filename}`
  res.json({ imageUrl })
})

app.get('/health', (req, res) => {
  res.json({ status: 'ok' })
})

// WebSocket for Proctoring Logs
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id)

  socket.on('proctoring_ping', async (data) => {
    // data: { attemptId, type: 'WEBCAM'|'MIC'|'LOCATION', event: 'OK' | 'NO_FACE' | 'MULTIPLE_FACES' | ... }
    if (data.event !== 'OK') {
      try {
        await prisma.monitoringLog.create({
          data: {
            attemptId: data.attemptId,
            type: data.type,
            event: data.event,
          }
        })
        console.log(`Proctoring Alert [${data.type}]: ${data.event} for attempt ${data.attemptId}`)
        
        // If severe violation, we could emit a termination event back to the specific client
        if (data.event === 'MULTIPLE_FACES' || data.event === 'LEFT_AREA' || data.event === 'EXIT_FULLSCREEN') {
          // Update attempt status to TERMINATED
          await prisma.attempt.update({
            where: { id: data.attemptId },
            data: { status: 'TERMINATED', terminationReason: data.event }
          })
          socket.emit('terminate_attempt', { reason: data.event })
        }
      } catch (e) {
        console.error('Error saving proctoring log', e)
      }
    }
  })

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id)
  })
})

const PORT = process.env.PORT || 5000

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
