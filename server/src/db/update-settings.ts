import { db } from '../config/database'
import { settings } from './schema'
import { eq, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'

const NEW_SETTINGS = [
  { key: 'lianlianpay_merchant_id', value: '', group: 'payment', description: '连连支付商户ID' },
  { key: 'lianlianpay_private_key', value: '', group: 'payment', description: '连连支付私钥' },
  { key: 'lianlianpay_public_key', value: '', group: 'payment', description: '连连支付公钥' },
  { key: 'lianlianpay_mode', value: 'sandbox', group: 'payment', description: '连连支付模式' },
]

const OLD_KEYS_TO_DELETE = [
  'antym_client_id',
  'antym_private_key',
  'antym_public_key',
  'antym_mode',
]

async function updateSettings() {
  console.log('=== 更新支付设置字段 ===\n')

  try {
    // 删除旧的 antym 字段
    console.log('1. 删除旧的 antym 字段...')
    await db.delete(settings).where(inArray(settings.key, OLD_KEYS_TO_DELETE))
    console.log('   删除完成')

    // 添加新字段
    console.log('\n2. 添加新的支付设置字段...')
    for (const setting of NEW_SETTINGS) {
      const existing = await db.select({ id: settings.id }).from(settings).where(eq(settings.key, setting.key)).limit(1)
      if (existing.length === 0) {
        await db.insert(settings).values({
          id: uuidv4(),
          ...setting,
        })
        console.log(`   ✅ 添加: ${setting.key}`)
      } else {
        console.log(`   ⏭️ 已存在: ${setting.key}`)
      }
    }

    // 验证结果
    console.log('\n3. 验证支付设置...')
    const paymentSettings = await db.select({ key: settings.key }).from(settings).where(eq(settings.group, 'payment'))
    console.log(`   支付设置数量: ${paymentSettings.length}`)
    console.log(`   支付设置列表: ${paymentSettings.map(s => s.key).join(', ')}`)

    console.log('\n=== 更新完成 ===')
    
  } catch (error) {
    console.error('❌ 更新失败:', error)
    process.exit(1)
  }
}

updateSettings()