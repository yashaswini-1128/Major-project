import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  await prisma.monitoringLog.deleteMany({})
  await prisma.attempt.deleteMany({})
  await prisma.question.deleteMany({})
  await prisma.test.deleteMany({})
  console.log('✅ All tests, questions, attempts, and logs deleted.')
  await prisma.$disconnect()
}

main().catch(e => { console.error(e); process.exit(1) })
