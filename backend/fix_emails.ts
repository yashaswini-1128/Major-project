import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const students = await prisma.user.findMany({ where: { role: 'STUDENT' } })
  for (const s of students) {
    if (s.email.endsWith('@lab.edu')) {
      await prisma.user.update({
        where: { id: s.id },
        data: { email: s.email.replace('@lab.edu', '@dsu.edu.in') }
      })
    }
  }

  const faculty = await prisma.user.findMany({ where: { role: 'FACULTY' } })
  for (const f of faculty) {
    if (f.email.endsWith('@lab.edu')) {
      await prisma.user.update({
        where: { id: f.id },
        data: { email: f.email.replace('@lab.edu', '@dsu.edu.in') }
      })
    }
  }

  console.log('Emails updated successfully.')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
