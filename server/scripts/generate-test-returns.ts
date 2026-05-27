import { db } from '../src/config/database'
import { returns, returnItems, returnLogs, orderItems, orders, users } from '../src/db/schema'
import { v4 as uuidv4 } from '../src/utils/uuid'

const returnTypes: ('return' | 'exchange' | 'refund')[] = ['return', 'exchange', 'refund']
const returnReasons: ('defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'arrived_late' | 'other')[] = [
  'defective', 'wrong_item', 'not_as_described', 'changed_mind', 'arrived_late', 'other'
]
const statuses: ('pending' | 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled')[] = [
  'pending', 'approved', 'processing', 'completed'
]

const reasonDetails: Record<string, string[]> = {
  defective: ['商品收到时已损坏', '无法正常开机', '充电接口接触不良'],
  wrong_item: ['收到的商品与订单不符', '颜色发错', '型号不对'],
  not_as_described: ['图片与实物差距太大', '尺寸不符', '材质与描述不一致'],
  changed_mind: ['个人原因不想要了', '买错了', '已经有同款'],
  arrived_late: ['超过预计送达时间3天', '物流太慢'],
  other: ['包装破损', '缺少配件', '其他原因'],
}

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomDate(daysAgo: number): Date {
  const date = new Date()
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo))
  return date
}

async function generateTestReturns() {
  console.log('Generating test return data...')

  const [orderList, userList, orderItemList] = await Promise.all([
    db.select({ id: orders.id }).from(orders).limit(10),
    db.select({ id: users.id }).from(users).limit(10),
    db.select().from(orderItems).limit(20),
  ])

  for (let i = 0; i < Math.min(orderList.length, 8); i++) {
    console.log(`Creating return ${i + 1}...`)
    
    const order = orderList[i]
    const user = userList[Math.floor(Math.random() * userList.length)]
    const orderItem = orderItemList[Math.floor(Math.random() * orderItemList.length)]
    const type = randomItem(returnTypes)
    const reason = randomItem(returnReasons)
    const status = i < 4 ? 'pending' : randomItem(statuses)
    
    const returnId = uuidv4()
    const createdAt = randomDate(14)
    
    const returnData = {
      id: returnId,
      orderId: order.id,
      userId: user.id,
      type,
      status,
      reason,
      reasonDetail: randomItem(reasonDetails[reason]),
      images: JSON.stringify([
        `https://picsum.photos/seed/${i}/400/300`,
        `https://picsum.photos/seed/${i + 100}/400/300`
      ]),
      adminNote: status !== 'pending' ? '已处理' : null,
      processedBy: status !== 'pending' ? 'admin001' : null,
      processedAt: status !== 'pending' ? randomDate(7) : null,
      refundAmount: status === 'completed' ? randomInt(50, 500) : null,
      refundReason: status === 'completed' ? '退款完成' : null,
      completedAt: status === 'completed' ? randomDate(3) : null,
      createdAt,
      updatedAt: createdAt,
    }

    await db.insert(returns).values(returnData)

    const itemData = {
      id: uuidv4(),
      returnId,
      orderItemId: orderItem.id,
      productId: orderItem.productId,
      variantId: orderItem.variantId,
      productName: orderItem.productName,
      variantDescription: orderItem.variantDescription,
      quantity: randomInt(1, orderItem.quantity),
      newVariantId: type === 'exchange' ? `newVar${i}` : null,
      newProductName: type === 'exchange' ? `更换为其他款式` : null,
    }

    await db.insert(returnItems).values(itemData)

    const logData = {
      id: uuidv4(),
      returnId,
      action: 'created' as const,
      operatorType: 'user' as const,
      operatorId: user.id,
      createdAt: createdAt,
    }

    await db.insert(returnLogs).values(logData)

    if (status !== 'pending') {
      const statusLog = {
        id: uuidv4(),
        returnId,
        action: 'status_changed' as const,
        fromStatus: 'pending',
        toStatus: status,
        operatorType: 'admin' as const,
        operatorId: 'admin001',
        note: status === 'approved' ? '同意申请' : status === 'rejected' ? '拒绝理由：不符合退换货条件' : '处理中',
        createdAt: randomDate(7),
      }
      await db.insert(returnLogs).values(statusLog)
    }
  }

  console.log('✅ Test return data generated successfully!')
  process.exit(0)
}

generateTestReturns().catch((error) => {
  console.error('❌ Error generating test data:', error)
  process.exit(1)
})
