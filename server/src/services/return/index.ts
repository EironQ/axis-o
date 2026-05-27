import { db } from '../../config/database'
import { returns, returnItems, returnLogs } from '../../db/schema'
import { users, orders, productImages, orderItems } from '../../db/schema'
import { eq, and, desc, sql, or, like, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from '../../utils/uuid'

export interface CreateReturnInput {
  orderId: string
  userId: string
  type: 'return' | 'exchange' | 'refund'
  reason: 'defective' | 'wrong_item' | 'not_as_described' | 'changed_mind' | 'arrived_late' | 'other'
  reasonDetail?: string
  images?: string[]
  items: Array<{
    orderItemId: string
    quantity: number
    newVariantId?: string
    newProductName?: string
  }>
}

export interface UpdateReturnInput {
  status?: 'approved' | 'rejected' | 'processing' | 'completed' | 'cancelled'
  adminNote?: string
  processedBy?: string
  refundAmount?: number
  refundReason?: string
}

export const ReturnService = {
  async create(input: CreateReturnInput) {
    const returnId = uuidv4()
    const now = new Date()

    const imagesJson = input.images ? JSON.stringify(input.images) : null

    await db.insert(returns).values({
      id: returnId,
      orderId: input.orderId,
      userId: input.userId,
      type: input.type,
      reason: input.reason,
      reasonDetail: input.reasonDetail,
      images: imagesJson,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    })

    for (const item of input.items) {
      await db.insert(returnItems).values({
        id: uuidv4(),
        returnId,
        orderItemId: item.orderItemId,
        productId: '',
        variantId: item.newVariantId || '',
        productName: '',
        variantDescription: '',
        quantity: item.quantity,
        newVariantId: item.newVariantId,
        newProductName: item.newProductName,
        createdAt: now,
      })
    }

    await db.insert(returnLogs).values({
      id: uuidv4(),
      returnId,
      action: 'created',
      toStatus: 'pending',
      operatorId: input.userId,
      operatorType: 'user',
      createdAt: now,
    })

    return this.getById(returnId)
  },

  async getById(returnId: string, userId?: string) {
    const conditions = [eq(returns.id, returnId)]
    if (userId) {
      conditions.push(eq(returns.userId, userId))
    }

    const [returnData] = await db
      .select({
        id: returns.id,
        orderId: returns.orderId,
        userId: returns.userId,
        type: returns.type,
        status: returns.status,
        reason: returns.reason,
        reasonDetail: returns.reasonDetail,
        images: returns.images,
        adminNote: returns.adminNote,
        processedBy: returns.processedBy,
        processedAt: returns.processedAt,
        refundAmount: returns.refundAmount,
        refundReason: returns.refundReason,
        completedAt: returns.completedAt,
        createdAt: returns.createdAt,
        updatedAt: returns.updatedAt,
        orderNumber: orders.orderNumber,
        userName: sql<string>`CONCAT(${users.lastName}, ${users.firstName})`,
      })
      .from(returns)
      .leftJoin(orders, eq(returns.orderId, orders.id))
      .leftJoin(users, eq(returns.userId, users.id))
      .where(and(...conditions))
      .limit(1)

    if (!returnData) return null

    const rawItems = await db
      .select({
        id: returnItems.id,
        returnId: returnItems.returnId,
        orderItemId: returnItems.orderItemId,
        productId: sql<string>`COALESCE(NULLIF(${returnItems.productId}, ''), ${orderItems.productId})`.as('productId'),
        variantId: sql<string>`COALESCE(NULLIF(${returnItems.variantId}, ''), ${orderItems.variantId})`.as('variantId'),
        productName: sql<string>`COALESCE(NULLIF(${returnItems.productName}, ''), ${orderItems.productName})`.as('productName'),
        variantDescription: sql<string>`COALESCE(NULLIF(${returnItems.variantDescription}, ''), ${orderItems.variantDescription})`.as('variantDescription'),
        quantity: returnItems.quantity,
        newVariantId: returnItems.newVariantId,
        newProductName: returnItems.newProductName,
        createdAt: returnItems.createdAt,
      })
      .from(returnItems)
      .leftJoin(orderItems, eq(returnItems.orderItemId, orderItems.id))
      .where(eq(returnItems.returnId, returnId))

    const productIds = [...new Set(rawItems.map((item) => item.productId).filter(Boolean))]
    let imagesByProduct: Record<string, string> = {}
    if (productIds.length > 0) {
      const productImagesResult = await db
        .select()
        .from(productImages)
        .where(and(inArray(productImages.productId, productIds), eq(productImages.isPrimary, 1)))
      for (const img of productImagesResult) {
        if (!imagesByProduct[img.productId]) {
          imagesByProduct[img.productId] = img.url
        }
      }
      if (Object.keys(imagesByProduct).length < productIds.length) {
        const fallbackImages = await db
          .select()
          .from(productImages)
          .where(and(inArray(productImages.productId, productIds)))
          .orderBy(productImages.sortOrder)
        for (const img of fallbackImages) {
          if (!imagesByProduct[img.productId]) {
            imagesByProduct[img.productId] = img.url
          }
        }
      }
    }

    const itemsWithImages = rawItems.map((item) => ({
      ...item,
      imageUrl: imagesByProduct[item.productId] || null,
    }))

    const logs = await db
      .select()
      .from(returnLogs)
      .where(eq(returnLogs.returnId, returnId))
      .orderBy(desc(returnLogs.createdAt))

    const images = returnData.images ? JSON.parse(returnData.images as string) : []

    return {
      ...returnData,
      images,
      items: itemsWithImages,
      logs,
    }
  },

  async list(userId: string, options: { page?: number; limit?: number; status?: string } = {}) {
    const page = options.page || 1
    const limit = options.limit || 10
    const offset = (page - 1) * limit

    const conditions = [eq(returns.userId, userId)]
    if (options.status) {
      conditions.push(eq(returns.status, options.status as any))
    }

    const list = await db
      .select({
        id: returns.id,
        orderId: returns.orderId,
        type: returns.type,
        status: returns.status,
        reason: returns.reason,
        refundAmount: returns.refundAmount,
        createdAt: returns.createdAt,
        updatedAt: returns.updatedAt,
      })
      .from(returns)
      .where(and(...conditions))
      .orderBy(desc(returns.createdAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(returns)
      .where(and(...conditions))
    const totalCount = parseInt(countResult[0]?.count as string) || 0

    const listWithItems = await Promise.all(
      list.map(async (item) => {
        const items = await db
          .select()
          .from(returnItems)
          .where(eq(returnItems.returnId, item.id))
        return { ...item, itemsCount: items.length }
      })
    )

    return {
      list: listWithItems,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    }
  },

  async adminList(options: {
    page?: number
    limit?: number
    status?: string
    type?: string
    search?: string
  } = {}) {
    const page = options.page || 1
    const limit = options.limit || 20
    const offset = (page - 1) * limit

    const conditions: any[] = []
    if (options.status) {
      conditions.push(eq(returns.status, options.status as any))
    }
    if (options.type) {
      conditions.push(eq(returns.type, options.type as any))
    }
    if (options.search) {
      const searchTerm = `%${options.search}%`
      conditions.push(or(
        like(returns.id, searchTerm),
        like(returns.orderId, searchTerm)
      ))
    }

    const list = await db
      .select({
        id: returns.id,
        orderId: returns.orderId,
        userId: returns.userId,
        type: returns.type,
        status: returns.status,
        reason: returns.reason,
        reasonDetail: returns.reasonDetail,
        images: returns.images,
        adminNote: returns.adminNote,
        processedBy: returns.processedBy,
        processedAt: returns.processedAt,
        refundAmount: returns.refundAmount,
        refundReason: returns.refundReason,
        completedAt: returns.completedAt,
        createdAt: returns.createdAt,
        updatedAt: returns.updatedAt,
        orderNumber: orders.orderNumber,
        userName: sql<string>`CONCAT(${users.lastName}, ${users.firstName})`,
      })
      .from(returns)
      .leftJoin(orders, eq(returns.orderId, orders.id))
      .leftJoin(users, eq(returns.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(returns.createdAt))
      .limit(limit)
      .offset(offset)

    const countResult = await db
      .select({ count: sql`COUNT(*)` })
      .from(returns)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const totalCount = parseInt(countResult[0]?.count as string) || 0

    const statsResult = await db
      .select({
        status: returns.status,
        count: sql`COUNT(*)`,
      })
      .from(returns)
      .groupBy(returns.status)

    const stats = {
      total: totalCount,
      pending: 0,
      approved: 0,
      processing: 0,
      completed: 0,
      rejected: 0,
    }

    for (const row of statsResult) {
      if (row.status in stats) {
        stats[row.status as keyof typeof stats] = parseInt(row.count as string)
      }
    }

    return {
      list,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
      stats,
    }
  },

  async update(returnId: string, input: UpdateReturnInput, operatorId: string, operatorType: 'user' | 'admin' = 'admin') {
    const [existing] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1)

    if (!existing) {
      throw new Error('Return not found')
    }

    const updateData: any = {
      updatedAt: new Date(),
    }

    if (input.status) {
      updateData.status = input.status
      if (input.status === 'completed') {
        updateData.completedAt = new Date()
      }
    }

    if (input.adminNote !== undefined) {
      updateData.adminNote = input.adminNote
    }

    if (input.processedBy) {
      updateData.processedBy = input.processedBy
      updateData.processedAt = new Date()
    }

    if (input.refundAmount !== undefined) {
      updateData.refundAmount = input.refundAmount
    }

    if (input.refundReason !== undefined) {
      updateData.refundReason = input.refundReason
    }

    await db.update(returns).set(updateData).where(eq(returns.id, returnId))

    if (input.status && input.status !== existing.status) {
      await db.insert(returnLogs).values({
        id: uuidv4(),
        returnId,
        action: 'status_changed',
        fromStatus: existing.status,
        toStatus: input.status,
        operatorId,
        operatorType,
        createdAt: new Date(),
      })
    }

    return this.getById(returnId)
  },

  async addLog(returnId: string, log: {
    action: 'note_added' | 'image_added' | 'refund_initiated' | 'refund_completed'
    operatorId: string
    operatorType: 'user' | 'admin' | 'system'
    note?: string
  }) {
    const [returnData] = await db
      .select()
      .from(returns)
      .where(eq(returns.id, returnId))
      .limit(1)

    await db.insert(returnLogs).values({
      id: uuidv4(),
      returnId,
      action: log.action,
      toStatus: returnData?.status,
      operatorId: log.operatorId,
      operatorType: log.operatorType,
      note: log.note,
      createdAt: new Date(),
    })
  },

  async refund(returnId: string, refundAmount: number, operatorId: string) {
    const returnData = await this.getById(returnId)

    if (!returnData) throw new Error('Return not found')
    if (returnData.status !== 'approved') throw new Error('Only approved returns can be refunded')

    await db.update(returns)
      .set({
        status: 'completed',
        refundAmount: String(refundAmount),
        completedAt: new Date(),
        updatedAt: new Date(),
        processedBy: operatorId,
        processedAt: new Date(),
      })
      .where(eq(returns.id, returnId))

    if (returnData.type === 'return' || returnData.type === 'refund') {
      await db.update(orders)
        .set({ status: 'refunded' })
        .where(eq(orders.id, returnData.orderId))
    }

    await db.insert(returnLogs).values({
      id: uuidv4(),
      returnId,
      action: 'refund_completed',
      fromStatus: 'approved',
      toStatus: 'completed',
      operatorId,
      operatorType: 'admin',
      note: `退款 ¥${refundAmount}`,
      createdAt: new Date(),
    })

    return this.getById(returnId)
  },
}