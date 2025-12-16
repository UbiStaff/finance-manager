import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      password: 'password', // In real app, hash this
    },
  })

  const categories = [
    { name: '餐饮', type: 'expense' },
    { name: '交通', type: 'expense' },
    { name: '工资', type: 'income' },
    { name: '奖金', type: 'income' },
  ]

  for (const cat of categories) {
    // Check if exists to avoid duplicates
    const exists = await prisma.category.findFirst({
        where: { name: cat.name, userId: user.id, type: cat.type }
    });
    if (!exists) {
        await prisma.category.create({
            data: {
                name: cat.name,
                type: cat.type,
                userId: user.id,
            },
        })
    }
  }

  const accounts = [
    { name: '现金' },
    { name: '支付宝' },
    { name: '微信' },
    { name: '银行卡 1234' },
  ]

  for (const acc of accounts) {
    const exists = await prisma.account.findFirst({
        where: { name: acc.name, userId: user.id }
    });
    if (!exists) {
        await prisma.account.create({
            data: {
                name: acc.name,
                userId: user.id,
            },
        })
    }
  }

  console.log('Seed data created')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
