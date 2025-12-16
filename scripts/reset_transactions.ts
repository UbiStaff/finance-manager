import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min
}

function randInt(min: number, max: number) {
  return Math.floor(rand(min, max + 1))
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomDateWithin(days: number) {
  const now = Date.now()
  const offset = randInt(0, days) * 24 * 60 * 60 * 1000
  return new Date(now - offset)
}

async function ensureDefaults(userId: number) {
  const existingCats = await prisma.category.findMany({ where: { userId } })
  const existingAccs = await prisma.account.findMany({ where: { userId } })

  if (existingCats.length === 0) {
    await prisma.category.createMany({
      data: [
        { name: '餐饮', type: 'expense', userId },
        { name: '交通', type: 'expense', userId },
        { name: '娱乐', type: 'expense', userId },
        { name: '购物', type: 'expense', userId },
        { name: '生活缴费', type: 'expense', userId },
        { name: '工资', type: 'income', userId },
        { name: '奖金', type: 'income', userId },
        { name: '理财收益', type: 'income', userId },
      ],
      skipDuplicates: true,
    })
  }

  if (existingAccs.length === 0) {
    await prisma.account.createMany({
      data: [
        { name: '现金', userId },
        { name: '支付宝', userId },
        { name: '微信', userId },
        { name: '银行卡 ****1234', userId },
        { name: '银行卡 ****5678', userId },
      ],
      skipDuplicates: true,
    })
  }
}

async function main() {
  const user = await prisma.user.findFirst({ where: { username: 'admin' } })
  const userId = user?.id || 1

  await prisma.transaction.deleteMany({})

  await ensureDefaults(userId)

  const categories = await prisma.category.findMany({ where: { userId } })
  const accounts = await prisma.account.findMany({ where: { userId } })

  const notes = [
    '测试记录',
    '日常消费',
    '购物订单',
    '交通出行',
    '餐饮消费',
    '生活缴费',
    '娱乐活动',
    '学习支出',
    '工资入账',
    '红包转账',
  ]

  const batch: any[] = []

  for (let i = 0; i < 100; i++) {
    const isIncome = Math.random() < 0.3
    const type = isIncome ? 'income' : 'expense'
    const catPool = categories.filter((c) => c.type === type)
    const category = catPool.length ? pick(catPool) : pick(categories)
    const account = pick(accounts)
    const amount = Number(
      (isIncome ? rand(200, 5000) : rand(5, 500)).toFixed(2)
    )
    const time = randomDateWithin(120)
    const note = `${pick(notes)} #${randInt(1000, 9999)}`

    batch.push({
      amount,
      type,
      time,
      note,
      categoryId: category.id,
      accountId: account.id,
      userId,
    })
  }

  for (const t of batch) {
    await prisma.transaction.create({ data: t })
  }

  console.log('Reset done. Inserted:', batch.length)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

