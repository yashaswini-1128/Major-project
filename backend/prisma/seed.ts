import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const passwordHash = await bcrypt.hash('password123', 10)

  // Create Faculty
  const faculty = await prisma.user.upsert({
    where: { email: 'faculty@lab.edu' },
    update: {},
    create: {
      name: 'Dr. Smith',
      email: 'faculty@dsu.edu.in',
      password: passwordHash,
      role: 'FACULTY',
    },
  })

  // Create Student
  const student = await prisma.user.upsert({
    where: { email: 'student@lab.edu' },
    update: {},
    create: {
      name: 'Jane Doe',
      email: 'student@dsu.edu.in',
      password: passwordHash,
      role: 'STUDENT',
      isAllowed: true,
    },
  })

  // Create a Sample Test
  const test = await prisma.test.create({
    data: {
      title: 'Introduction to Parasitology',
      subject: 'Parasitology',
      enabled: true,
      questions: {
        create: [
          {
            imageUrl: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=600&auto=format&fit=crop', // Placeholder microbe
            text: 'Identify the parasite shown in the blood smear.',
            correctAnswer: 'Plasmodium falciparum',
            hintText: 'Causes the most severe form of malaria.',
          },
          {
            imageUrl: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=600&auto=format&fit=crop', // Placeholder microscope view
            text: 'What is the characteristic shape of this organism?',
            correctAnswer: 'Banana shape',
            hintText: 'Think of a common fruit.',
          }
        ]
      }
    }
  })

  console.log({ faculty, student, test })
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
