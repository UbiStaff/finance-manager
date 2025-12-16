import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

function sanitize(name: string): string {
  const raw = (name || '').trim()
  if (!raw) return raw
  if (/支付宝|Alipay/i.test(raw)) return '支付宝'
  if (/微信钱包/.test(raw)) return '微信钱包'
  if (/微信|WeChat/i.test(raw)) return '微信'

  const m1 = raw.match(/\((\d{4})\)/)
  const m2 = raw.match(/(\d{4})$/)
  const last4 = m1?.[1] || m2?.[1]

  const brandMatch = raw.match(/(工商银行|建设银行|招商银行|农业银行|中国银行|交通银行|民生银行|中信银行|广发银行|邮储银行)/)
  const brand = brandMatch ? brandMatch[1] : undefined

  if (last4) {
    if (brand) return `${brand} ****${last4}`
    return `银行卡 ****${last4}`
  }

  if (/储蓄卡|借记卡|信用卡/.test(raw)) return '银行卡 ****'
  return raw.replace(/\d{4,}/g, '****')
}

async function main() {
  const accounts = await prisma.account.findMany()
  let updated = 0
  for (const acc of accounts) {
    const masked = sanitize(acc.name)
    if (masked && masked !== acc.name) {
      await prisma.account.update({
        where: { id: acc.id },
        data: { name: masked },
      })
      updated++
    }
  }
  console.log('Masked accounts updated:', updated)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

