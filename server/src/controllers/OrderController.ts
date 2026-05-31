import { Request, Response } from 'express'
import { db } from '../config/database'
import { orders, orderItems, cartItems, productVariants, products, productImages, addresses, discountCodes, payments, shipments, users, paymentEvents, returns } from '../db/schema'
import { eq, and, sql, desc, exists } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'
import { getCachedSetting } from '../services/settingsCache'
import { StripeService } from '../services/payment/stripe'
import { PayPalService } from '../services/payment/paypal'
import { AirwallexService } from '../services/payment/airwallex'

export const OrderController = {
  list: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 10
      const offset = (page - 1) * limit

      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
          createdAt: orders.createdAt,
          paidAt: orders.paidAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
          hasReturnRequest: exists(
            db.select().from(returns).where(eq(returns.orderId, orders.id))
          ),
        })
        .from(orders)
        .where(eq(orders.userId, userId))
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db.select({ count: sql`COUNT(*)` }).from(orders).where(eq(orders.userId, userId))
      const totalCount = parseInt(countResult[0]?.count as string) || 0

      res.json({
        success: true,
        data: {
          orders: orderList,
          pagination: {
            page,
            limit,
            total: totalCount,
            totalPages: Math.ceil(totalCount / limit),
          },
        },
      })
    } catch (error) {
      console.error('Order list error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } })
    }
  },

  getById: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const orderId = req.params.id as string

      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          currency: orders.currency,
          subtotal: orders.subtotal,
          shippingCost: orders.shippingCost,
          taxAmount: orders.taxAmount,
          discountAmount: orders.discountAmount,
          total: orders.total,
          shippingMethod: orders.shippingMethod,
          notes: orders.notes,
          createdAt: orders.createdAt,
          paidAt: orders.paidAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
          shippingAddressId: orders.shippingAddressId,
          billingAddressId: orders.billingAddressId,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]

      const items = await Promise.all(
        (await db
          .select({
            id: orderItems.id,
            productId: orderItems.productId,
            variantId: orderItems.variantId,
            productName: orderItems.productName,
            variantDescription: orderItems.variantDescription,
            quantity: orderItems.quantity,
            unitPrice: orderItems.unitPrice,
            totalPrice: orderItems.totalPrice,
            productNameZh: products.nameZh,
          })
          .from(orderItems)
          .innerJoin(products, eq(orderItems.productId, products.id))
          .where(eq(orderItems.orderId, orderId))
        ).map(async (item) => {
          const images = await db
            .select({ url: productImages.url })
            .from(productImages)
            .where(and(eq(productImages.productId, item.productId), eq(productImages.isPrimary, 1)))
            .limit(1)
          return {
            ...item,
            image: images[0]?.url,
            productName: item.productNameZh || item.productName,
          }
        })
      )

      const shippingAddress = await db
        .select({
          firstName: addresses.firstName,
          lastName: addresses.lastName,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
          country: addresses.country,
          phone: addresses.phone,
        })
        .from(addresses)
        .where(eq(addresses.id, order.shippingAddressId))
        .limit(1)

      const billingAddress = await db
        .select({
          firstName: addresses.firstName,
          lastName: addresses.lastName,
          line1: addresses.line1,
          line2: addresses.line2,
          city: addresses.city,
          state: addresses.state,
          postalCode: addresses.postalCode,
          country: addresses.country,
          phone: addresses.phone,
        })
        .from(addresses)
        .where(eq(addresses.id, order.billingAddressId))
        .limit(1)

      const payment = await db
        .select({
          provider: payments.provider,
          transactionId: payments.transactionId,
          status: payments.status,
          amount: payments.amount,
          currency: payments.currency,
          feeAmount: payments.feeAmount,
          createdAt: payments.createdAt,
        })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.createdAt))
        .limit(1)

      res.json({
        success: true,
        data: {
          ...order,
          items,
          shippingAddress: shippingAddress[0],
          billingAddress: billingAddress[0],
          payment: payment[0] || null,
        },
      })
    } catch (error) {
      console.error('Get order error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' } })
    }
  },

  create: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { shippingAddressId, billingAddressId, shippingMethod, discountCode, notes, currency = 'USD' } = req.body

      const shippingAddress = await db.select().from(addresses).where(and(eq(addresses.id, shippingAddressId), eq(addresses.userId, userId))).limit(1)
      if (shippingAddress.length === 0) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ADDRESS', message: 'Shipping address not found' } })
        return
      }

      const billingAddr = billingAddressId
        ? await db.select().from(addresses).where(and(eq(addresses.id, billingAddressId), eq(addresses.userId, userId))).limit(1)
        : shippingAddress

      if (billingAddr.length === 0) {
        res.status(400).json({ success: false, error: { code: 'INVALID_ADDRESS', message: 'Billing address not found' } })
        return
      }

      const cartItemsResult = await db
        .select({
          variantId: cartItems.variantId,
          quantity: cartItems.quantity,
          productId: productVariants.productId,
          colorName: productVariants.colorName,
          colorHex: productVariants.colorHex,
          size: productVariants.size,
          priceAdjustment: productVariants.priceAdjustment,
          productNameEn: products.nameEn,
          productNameZh: products.nameZh,
          basePrice: products.basePrice,
          productStock: products.stock,
        })
        .from(cartItems)
        .innerJoin(productVariants, eq(cartItems.variantId, productVariants.id))
        .innerJoin(products, eq(productVariants.productId, products.id))
        .where(eq(cartItems.userId, userId))

      if (cartItemsResult.length === 0) {
        res.status(400).json({ success: false, error: { code: 'EMPTY_CART', message: 'Cart is empty' } })
        return
      }

      const stockByProduct = new Map<string, { needed: number; stock: number }>()
      for (const item of cartItemsResult) {
        const entry = stockByProduct.get(item.productId) || { needed: 0, stock: Number(item.productStock) || 0 }
        entry.needed += item.quantity
        stockByProduct.set(item.productId, entry)
      }
      for (const [productId, info] of stockByProduct) {
        if (info.needed > info.stock) {
          res.status(400).json({ success: false, error: { code: 'INSUFFICIENT_STOCK', message: `Insufficient stock for product ${productId}` } })
          return
        }
      }

      let discountAmount = 0
      let discountCodeId = null
      if (discountCode) {
        const discount = await db
          .select()
          .from(discountCodes)
          .where(and(eq(discountCodes.code, discountCode), eq(discountCodes.isActive, 1)))
          .limit(1)

        if (discount.length > 0) {
          const disc = discount[0]
          const now = new Date()
          if (now >= disc.validFrom && (!disc.validUntil || now <= disc.validUntil)) {
            discountAmount = parseFloat(disc.value.toString())
            discountCodeId = disc.id
          }
        }
      }

      let subtotal = 0
      const orderItemsData = cartItemsResult.map((item) => {
        const price = parseFloat(item.basePrice.toString()) + parseFloat(item.priceAdjustment.toString())
        subtotal += price * item.quantity
        return {
          id: uuidv4(),
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productNameZh,
          variantDescription: `${item.colorName} / ${item.size}`,
          quantity: item.quantity,
          unitPrice: price.toString(),
          totalPrice: (price * item.quantity).toString(),
          createdAt: new Date(),
        }
      })

      const shippingCost = shippingMethod === 'express' ? (() => {
        const fee = parseFloat(getCachedSetting('shipping_fee'))
        return isNaN(fee) ? 50 : fee
      })() : 0
      const taxAmount = 0
      let total = subtotal + shippingCost - discountAmount
      total = parseFloat(total.toFixed(2))

      const orderId = uuidv4()
      const orderNumber = `AXO${Date.now()}`

      await db.transaction(async (tx) => {
        await tx.insert(orders).values({
          id: orderId,
          orderNumber,
          userId,
          shippingAddressId,
          billingAddressId: billingAddr[0].id,
          discountCodeId,
          status: 'pending',
          currency,
          subtotal: subtotal.toString(),
          shippingCost: shippingCost.toString(),
          taxAmount: taxAmount.toString(),
          discountAmount: discountAmount.toString(),
          total: total.toString(),
          shippingMethod,
          notes,
          createdAt: new Date(),
          updatedAt: new Date(),
        })

        await tx.insert(orderItems).values(orderItemsData.map(item => ({ ...item, orderId })))

        for (const [productId, info] of stockByProduct) {
          await tx.update(products)
            .set({ stock: sql`stock - ${info.needed}` } as any)
            .where(eq(products.id, productId))
        }

        await tx.delete(cartItems).where(eq(cartItems.userId, userId))
      })

      res.status(201).json({
        success: true,
        data: {
          orderId,
          orderNumber,
          status: 'pending',
          total,
          currency,
          items: orderItemsData.length,
        },
      })
    } catch (error) {
      console.error('Create order error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create order' } })
    }
  },

  cancel: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const orderId = req.params.id as string

      const orderResult = await db
        .select({ status: orders.status })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]
      if (order.status !== 'pending' && order.status !== 'paid') {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Cannot cancel order with status: ${order.status}` } })
        return
      }

      await db.transaction(async (tx) => {
        const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity })
          .from(orderItems).where(eq(orderItems.orderId, orderId))

        for (const item of items) {
          await tx.update(products)
            .set({ stock: sql`stock + ${item.quantity}` } as any)
            .where(eq(products.id, item.productId))
        }

        await tx.update(orders).set({ status: 'cancelled', cancelledAt: new Date(), updatedAt: new Date() }).where(eq(orders.id, orderId))
      })

      res.json({ success: true, data: { orderId, status: 'cancelled' } })
    } catch (error) {
      console.error('Cancel order error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to cancel order' } })
    }
  },

  adminList: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const status = req.query.status as string
      const search = req.query.search as string
      const offset = (page - 1) * limit

      const conditions = []
      if (status && status !== 'all') {
        conditions.push(eq(orders.status, status as any))
      }
      if (search) {
        conditions.push(
          sql`(${orders.orderNumber} LIKE ${`%${search}%`} OR ${users.firstName} LIKE ${`%${search}%`} OR ${users.lastName} LIKE ${`%${search}%`})`
        )
      }

      const orderList = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          subtotal: orders.subtotal,
          shippingCost: orders.shippingCost,
          taxAmount: orders.taxAmount,
          discountAmount: orders.discountAmount,
          total: orders.total,
          currency: orders.currency,
          shippingMethod: orders.shippingMethod,
          notes: orders.notes,
          createdAt: orders.createdAt,
          updatedAt: orders.updatedAt,
          paidAt: orders.paidAt,
          shippedAt: orders.shippedAt,
          deliveredAt: orders.deliveredAt,
          cancelledAt: orders.cancelledAt,
          userId: orders.userId,
          shippingAddressId: orders.shippingAddressId,
          billingAddressId: orders.billingAddressId,
        })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(orders.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .leftJoin(users, eq(orders.userId, users.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
      const total = Number(countResult[0].count)

      const ordersWithDetails = await Promise.all(
        orderList.map(async (order) => {
          const userResult = await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
              email: users.email,
              phone: users.phone,
            })
            .from(users)
            .where(eq(users.id, order.userId))
            .limit(1)

          const items = await db
            .select({
              id: orderItems.id,
              productId: orderItems.productId,
              variantId: orderItems.variantId,
              productName: orderItems.productName,
              variantDescription: orderItems.variantDescription,
              quantity: orderItems.quantity,
              unitPrice: orderItems.unitPrice,
              totalPrice: orderItems.totalPrice,
            })
            .from(orderItems)
            .where(eq(orderItems.orderId, order.id))

          const itemsWithImages = await Promise.all(
            items.map(async (item) => {
              const images = await db
                .select({ url: productImages.url })
                .from(productImages)
                .where(eq(productImages.productId, item.productId))
                .orderBy(productImages.sortOrder)
                .limit(1)
              return { ...item, image: images[0]?.url || null }
            })
          )

          const paymentResult = await db
            .select({
              provider: payments.provider,
              transactionId: payments.transactionId,
              status: payments.status,
            })
            .from(payments)
            .where(eq(payments.orderId, order.id))
            .orderBy(desc(payments.createdAt))
            .limit(1)

          return {
            id: order.id,
            orderNumber: order.orderNumber,
            status: order.status,
            subtotal: Number(order.subtotal),
            shippingCost: Number(order.shippingCost),
            taxAmount: Number(order.taxAmount),
            discountAmount: Number(order.discountAmount),
            total: Number(order.total),
            currency: order.currency,
            shippingMethod: order.shippingMethod,
            notes: order.notes,
            createdAt: order.createdAt,
            updatedAt: order.updatedAt,
            paidAt: order.paidAt,
            shippedAt: order.shippedAt,
            deliveredAt: order.deliveredAt,
            cancelledAt: order.cancelledAt,
            user: userResult[0] || null,
            items: itemsWithImages,
            payment: paymentResult[0] || null,
          }
        })
      )

      res.json({
        success: true,
        data: {
          orders: ordersWithDetails,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('Admin order list error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch orders' } })
    }
  },

  adminGetById: async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id as string

      const orderResult = await db
        .select()
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]

      const userResult = await db
        .select({
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
          phone: users.phone,
        })
        .from(users)
        .where(eq(users.id, order.userId))
        .limit(1)

      const items = await db
        .select({
          id: orderItems.id,
          productId: orderItems.productId,
          variantId: orderItems.variantId,
          productName: orderItems.productName,
          variantDescription: orderItems.variantDescription,
          quantity: orderItems.quantity,
          unitPrice: orderItems.unitPrice,
          totalPrice: orderItems.totalPrice,
        })
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId))

      const itemsWithImages = await Promise.all(
        items.map(async (item) => {
          const images = await db
            .select({ url: productImages.url })
            .from(productImages)
            .where(eq(productImages.productId, item.productId))
            .orderBy(productImages.sortOrder)
            .limit(1)
          return { ...item, image: images[0]?.url || null }
        })
      )

      const shippingAddress = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.shippingAddressId))
        .limit(1)

      const billingAddress = await db
        .select()
        .from(addresses)
        .where(eq(addresses.id, order.billingAddressId))
        .limit(1)

      const payment = await db
        .select({
          provider: payments.provider,
          transactionId: payments.transactionId,
          status: payments.status,
          amount: payments.amount,
        })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.createdAt))
        .limit(1)

      res.json({
        success: true,
        data: {
          ...order,
          user: userResult[0] || null,
          items: itemsWithImages,
          shippingAddress: shippingAddress[0] || null,
          billingAddress: billingAddress[0] || null,
          payment: payment[0] || null,
        },
      })
    } catch (error) {
      console.error('Admin get order error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch order' } })
    }
  },

  adminUpdateStatus: async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id as string
      const { status, trackingNumber } = req.body

      const validStatuses = ['pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded']
      if (!validStatuses.includes(status)) {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: 'Invalid status' } })
        return
      }

      const existing = await db.select({ id: orders.id, status: orders.status }).from(orders).where(eq(orders.id, orderId)).limit(1)
      if (existing.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const prevStatus = existing[0].status
      const isNewCancelOrRefund = (status === 'cancelled' || status === 'refunded') &&
        prevStatus !== 'cancelled' && prevStatus !== 'refunded'

      const updateData: Record<string, any> = { status, updatedAt: new Date() }
      if (status === 'paid') updateData.paidAt = new Date()
      if (status === 'shipped') updateData.shippedAt = new Date()
      if (status === 'delivered') updateData.deliveredAt = new Date()
      if (status === 'cancelled') updateData.cancelledAt = new Date()

      await db.transaction(async (tx) => {
        await tx.update(orders).set(updateData).where(eq(orders.id, orderId))

        if (isNewCancelOrRefund) {
          const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity })
            .from(orderItems).where(eq(orderItems.orderId, orderId))

          for (const item of items) {
            await tx.update(products)
              .set({ stock: sql`stock + ${item.quantity}` } as any)
              .where(eq(products.id, item.productId))
          }
        }
      })

      if (trackingNumber && status === 'shipped') {
        const existingShipment = await db.select({ id: shipments.id }).from(shipments).where(eq(shipments.orderId, orderId)).limit(1)
        if (existingShipment.length > 0) {
          await db.update(shipments).set({ trackingNumber, updatedAt: new Date() }).where(eq(shipments.orderId, orderId))
        } else {
          await db.insert(shipments).values({
            id: uuidv4(),
            orderId,
            carrier: 'other',
            trackingNumber,
            status: 'pending',
            createdAt: new Date(),
            updatedAt: new Date(),
          })
        }
      }

      res.json({ success: true, data: { orderId, status } })
    } catch (error) {
      console.error('Admin update order status error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update order status' } })
    }
  },

  adminRefund: async (req: Request, res: Response) => {
    try {
      const orderId = req.params.id as string
      const adminId = req.user!.userId
      const { refundAmount, note } = req.body

      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
        })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]

      if (order.status !== 'paid' && order.status !== 'processing' && order.status !== 'shipped') {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Cannot refund order with status: ${order.status}` } })
        return
      }

      const paymentResult = await db
        .select({
          id: payments.id,
          transactionId: payments.transactionId,
          status: payments.status,
          provider: payments.provider,
          amount: payments.amount,
          currency: payments.currency,
        })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .orderBy(desc(payments.createdAt))
        .limit(1)

      if (paymentResult.length === 0) {
        res.status(400).json({ success: false, error: { code: 'NO_PAYMENT', message: 'No payment found for this order' } })
        return
      }

      const payment = paymentResult[0]

      if (payment.status !== 'succeeded') {
        res.status(400).json({ success: false, error: { code: 'INVALID_PAYMENT_STATUS', message: `Payment status is ${payment.status}, cannot refund` } })
        return
      }

      if (!payment.transactionId) {
        res.status(400).json({ success: false, error: { code: 'NO_TRANSACTION', message: 'No transaction ID found for this payment' } })
        return
      }

      const amountToRefund = refundAmount && refundAmount > 0 
        ? parseFloat(refundAmount.toString()) 
        : parseFloat(order.total.toString())

      if (amountToRefund > parseFloat(order.total.toString())) {
        res.status(400).json({ success: false, error: { code: 'INVALID_AMOUNT', message: 'Refund amount cannot exceed order total' } })
        return
      }

      await db.insert(paymentEvents).values({
        id: uuidv4(),
        paymentId: payment.id,
        orderId,
        eventType: 'refund_requested',
        provider: payment.provider,
        providerEventId: payment.transactionId,
        amount: amountToRefund.toString(),
        currency: order.currency,
        statusBefore: payment.status,
        notes: note || `Admin refund requested for order #${order.orderNumber}`,
        createdAt: new Date(),
      })

      let refundResult: { id: string; status: string | null }
      try {
        if (payment.provider === 'stripe') {
          refundResult = await StripeService.createRefund(payment.transactionId, amountToRefund)
        } else if (payment.provider === 'paypal') {
          refundResult = await PayPalService.createRefund(payment.transactionId, amountToRefund, order.currency)
        } else if (payment.provider === 'airwallex') {
          refundResult = await AirwallexService.createRefund(payment.transactionId, amountToRefund, order.currency)
        } else {
          throw new Error(`Refund not supported for provider: ${payment.provider}`)
        }
      } catch (payError) {
        console.error(`[Admin Refund] Payment gateway refund failed:`, payError)
        await db.insert(paymentEvents).values({
          id: uuidv4(),
          paymentId: payment.id,
          orderId,
          eventType: 'refund_failed',
          provider: payment.provider,
          providerEventId: payment.transactionId,
          amount: amountToRefund.toString(),
          currency: order.currency,
          statusBefore: payment.status,
          notes: `Refund failed: ${(payError as Error).message}`,
          createdAt: new Date(),
        })
        throw payError
      }

      const isPartial = amountToRefund < parseFloat(order.total.toString())
      const refundStatus = isPartial ? 'partially_refunded' as const : 'refunded' as const
      const orderRefundStatus = isPartial ? order.status : 'refunded' as const

      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({ status: refundStatus, updatedAt: new Date() })
          .where(eq(payments.id, payment.id))

        if (!isPartial) {
          await tx
            .update(orders)
            .set({ status: orderRefundStatus, updatedAt: new Date() })
            .where(eq(orders.id, orderId))

          const items = await tx.select({ productId: orderItems.productId, quantity: orderItems.quantity })
            .from(orderItems).where(eq(orderItems.orderId, orderId))

          for (const item of items) {
            await tx.update(products)
              .set({ stock: sql`stock + ${item.quantity}` } as any)
              .where(eq(products.id, item.productId))
          }
        }

        await tx.insert(paymentEvents).values({
          id: uuidv4(),
          paymentId: payment.id,
          orderId,
          eventType: 'refund_succeeded',
          provider: payment.provider,
          providerEventId: refundResult.id,
          amount: amountToRefund.toString(),
          currency: order.currency,
          statusBefore: payment.status,
          statusAfter: refundStatus,
          rawData: JSON.stringify({ refund_id: refundResult.id, status: refundResult.status }),
          notes: isPartial ? `Partial refund: ${amountToRefund} ${order.currency}` : 'Full refund processed',
          createdAt: new Date(),
        })
      })

      res.json({
        success: true,
        data: {
          orderId,
          orderNumber: order.orderNumber,
          status: refundStatus,
          refundId: refundResult.id,
          refundAmount: amountToRefund,
          currency: order.currency,
          isPartial,
        },
        message: isPartial ? 'Partial refund processed successfully' : 'Refund processed successfully',
      })
    } catch (error) {
      console.error('Admin refund error:', error)
      res.status(500).json({ 
        success: false, 
        error: { code: 'INTERNAL_ERROR', message: (error as Error).message || 'Failed to process refund' } 
      })
    }
  },
}
