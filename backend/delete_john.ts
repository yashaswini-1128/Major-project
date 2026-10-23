import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Find students with name starting with John (SQLite — case-sensitive)
  const users = await prisma.user.findMany({
    where: {
      role: 'STUDENT',
      OR: [
        { name: { startsWith: 'John' } },
        { name: { startsWith: 'john' } }
      ]
    }
  })

  if (users.length === 0) {
    console.log('No student named John found.')
  } else {
    for (const u of users) {
      // Delete related attempts & logs first
      const attempts = await prisma.attempt.findMany({ where: { studentId: u.id } })
      for (const a of attempts) {
        await prisma.monitoringLog.deleteMany({ where: { attemptId: a.id } })
      }
      await prisma.attempt.deleteMany({ where: { studentId: u.id } })
      await prisma.user.delete({ where: { id: u.id } })
      console.log(`✅ Deleted student: ${u.name} (${u.email})`)
    }
  }

  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
