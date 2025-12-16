import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const targets = await prisma.account.findMany({
    where: {
      name: {
        contains: '工商银行',
      },
    },
  })

  let updated = 0
  for (const acc of targets) {
    if (/(7934)/.test(acc.name)) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { name: '建设银行储蓄卡（1234）' },
      })
      updated++
    }
  }

  console.log('Renamed accounts:', updated)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

