import { Request, Response } from 'express'
import { db } from '../config/database'
import { orders, payments, paymentEvents } from '../db/schema'
import { eq, and, desc, like, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'
import { PayPalService, getPayPalClientId } from '../services/payment/paypal'
import { LianlianpayService } from '../services/payment/lianlianpay'
import { OrderEmailHelper } from '../services/orderEmailHelper'

type EventType = 'intent_created' | 'intent_succeeded' | 'intent_failed' | 'intent_canceled' | 'refund_requested' | 'refund_succeeded' | 'refund_failed' | 'status_synced' | 'webhook_received'

interface EventLogParams {
  paymentId: string
  orderId: string
  eventType: EventType
  provider: 'paypal' | 'lianlianpay'
  providerEventId?: string | null
  amount?: string
  currency?: string
  feeAmount?: string | null
  statusBefore?: string | null
  statusAfter?: string | null
  rawData?: any
  notes?: string
}

function insertPaymentEvent(params: EventLogParams) {
  return db.insert(paymentEvents).values({
    id: uuidv4(),
    paymentId: params.paymentId,
    orderId: params.orderId,
    eventType: params.eventType,
    provider: params.provider,
    providerEventId: params.providerEventId || null,
    amount: params.amount || null,
    currency: params.currency || null,
    feeAmount: params.feeAmount || null,
    statusBefore: params.statusBefore || null,
    statusAfter: params.statusAfter || null,
    rawData: params.rawData ? JSON.stringify(params.rawData) : null,
    notes: params.notes || null,
    createdAt: new Date(),
  })
}

export const PaymentController = {
  createPaymentIntent: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const orderId = req.params.orderId as string
      const provider = (req.query.provider as string) || 'paypal'

      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]
      if (order.status !== 'pending') {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Order is ${order.status}` } })
        return
      }

      const existingPayment = await db
        .select({ id: payments.id, status: payments.status, transactionId: payments.transactionId, provider: payments.provider })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)

      if (existingPayment.length > 0) {
        if (existingPayment[0].status === 'processing' || existingPayment[0].status === 'pending') {
          if (provider === 'paypal' && existingPayment[0].transactionId && existingPayment[0].provider === 'paypal') {
            const publishableKey = await getPayPalClientId()
            res.json({
              success: true,
              data: {
                paymentId: existingPayment[0].id,
                orderId,
                orderNumber: order.orderNumber,
                amount: parseFloat(order.total.toString()),
                currency: 'USD',
                paypalOrderId: existingPayment[0].transactionId,
                publishableKey,
              },
            })
            return
          }
        }
        if (existingPayment[0].status === 'succeeded') {
          res.status(400).json({ success: false, error: { code: 'ALREADY_PAID', message: 'Order has already been paid' } })
          return
        }
      }

      const paymentId = uuidv4()

      if (provider === 'paypal') {
        try {
          const amount = parseFloat(order.total.toString())

          const paypalResult = await PayPalService.createOrder({
            orderId,
            orderNumber: order.orderNumber,
            amount: amount,
            currency: 'USD',
            description: `AXIS O - Order #${order.orderNumber}`,
          })

        const paymentData = {
          id: paymentId,
          orderId,
          provider: 'paypal' as const,
          transactionId: paypalResult.paypalOrderId,
          status: 'pending' as const,
          amount: order.total,
          currency: order.currency,
          createdAt: new Date(),
          updatedAt: new Date(),
        }

        await db.insert(payments).values(paymentData)

        await insertPaymentEvent({
          paymentId,
          orderId,
          eventType: 'intent_created',
          provider: 'paypal',
          providerEventId: paypalResult.paypalOrderId,
          amount: order.total,
          currency: order.currency,
          statusAfter: 'pending',
          notes: `PayPal order created for order #${order.orderNumber}`,
        })

        res.json({
            success: true,
            data: {
              paymentId,
              orderId,
              orderNumber: order.orderNumber,
              amount: amount,
              currency: 'USD',
              paypalOrderId: paypalResult.paypalOrderId,
              publishableKey: await getPayPalClientId(),
            },
          })
          return
        } catch (paypalError: any) {
          console.error('PayPal payment intent error:', paypalError)
          res.status(500).json({
            success: false,
            error: {
              code: 'PAYPAL_ERROR',
              message: paypalError?.message || 'PayPal支付服务暂时不可用，请稍后重试',
            },
          })
          return
        }
      }

      if (provider === 'lianlianpay') {
        try {
          const lianlianpayResult = await LianlianpayService.createPayment({
            orderId,
            orderNumber: order.orderNumber,
            amount: parseFloat(order.total.toString()),
            currency: order.currency,
            description: `AXIS O - Order #${order.orderNumber}`,
          })

          const paymentData = {
            id: paymentId,
            orderId,
            provider: 'lianlianpay' as const,
            transactionId: lianlianpayResult.paymentId,
            status: 'pending' as const,
            amount: order.total,
            currency: order.currency,
            createdAt: new Date(),
            updatedAt: new Date(),
          }

          await db.insert(payments).values(paymentData)

          await insertPaymentEvent({
            paymentId,
            orderId,
            eventType: 'intent_created',
            provider: 'lianlianpay',
            providerEventId: lianlianpayResult.paymentId,
            amount: order.total,
            currency: order.currency,
            statusAfter: 'pending',
            notes: `Lianlianpay payment created for order #${order.orderNumber}`,
          })

          res.json({
            success: true,
            data: {
              paymentId,
              orderId,
              orderNumber: order.orderNumber,
              amount: parseFloat(order.total.toString()),
              currency: order.currency,
              lianlianpayRedirectUrl: lianlianpayResult.redirectUrl,
            },
          })
          return
        } catch (lianlianpayError: any) {
          console.error('Lianlianpay payment error:', lianlianpayError)
          res.status(500).json({
            success: false,
            error: {
              code: 'LIANLIANPAY_ERROR',
              message: lianlianpayError?.message || '连连支付服务暂时不可用，请稍后重试',
            },
          })
          return
        }
      }

      res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: `Unsupported payment provider: ${provider}` } })
    } catch (error) {
      console.error('Create payment intent error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment intent' } })
    }
  },

  createRefund: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const orderId = req.params.orderId as string

      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]
      if (order.status !== 'paid' && order.status !== 'processing') {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Cannot refund order with status: ${order.status}` } })
        return
      }

      const paymentResult = await db
        .select({ id: payments.id, transactionId: payments.transactionId, status: payments.status, provider: payments.provider })
        .from(payments)
        .where(eq(payments.orderId, orderId))
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

      await insertPaymentEvent({
        paymentId: payment.id,
        orderId,
        eventType: 'refund_requested',
        provider: payment.provider,
        providerEventId: payment.transactionId,
        amount: order.total,
        currency: order.currency,
        statusBefore: payment.status,
        notes: `Refund requested for order #${order.orderNumber}`,
      })

      let refund: { id: string; status: string | null }
      if (payment.provider === 'paypal') {
        refund = await PayPalService.createRefund(payment.transactionId, parseFloat(order.total.toString()), order.currency)
      } else {
        res.status(400).json({ success: false, error: { code: 'UNSUPPORTED_PROVIDER', message: `Refund not supported for provider: ${payment.provider}` } })
        return
      }

      const refundStatus = refund.status === 'succeeded' || refund.status === 'COMPLETED' ? 'refunded' as const : 'processing' as const

      await db.transaction(async (tx) => {
        await tx
          .update(payments)
          .set({ status: refundStatus, updatedAt: new Date() })
          .where(eq(payments.id, payment.id))

        if (refundStatus === 'refunded') {
          await tx
            .update(orders)
            .set({ status: 'refunded', updatedAt: new Date() })
            .where(eq(orders.id, orderId))
        }

        await tx.insert(paymentEvents).values({
          id: uuidv4(),
          paymentId: payment.id,
          orderId,
          eventType: refundStatus === 'refunded' ? 'refund_succeeded' : 'refund_failed',
          provider: payment.provider,
          providerEventId: refund.id,
          amount: order.total,
          currency: order.currency,
          statusBefore: 'succeeded',
          statusAfter: refundStatus,
          rawData: JSON.stringify({ refund_id: refund.id, status: refund.status }),
          notes: refundStatus === 'refunded' ? `Refund processed: ${refund.id}` : `Refund pending: ${refund.id}`,
          createdAt: new Date(),
        })
      })

      res.json({
        success: true,
        data: {
          orderId,
          status: refundStatus,
          refundId: refund.id,
        },
      })
    } catch (error) {
      console.error('Refund error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to process refund' } })
    }
  },

  capturePayPalOrder: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { orderId, paypalOrderId } = req.body

      if (!orderId || !paypalOrderId) {
        res.status(400).json({ success: false, error: { code: 'MISSING_PARAMS', message: 'orderId and paypalOrderId are required' } })
        return
      }

      const orderResult = await db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          status: orders.status,
          total: orders.total,
          currency: orders.currency,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]
      if (order.status !== 'pending') {
        res.status(400).json({ success: false, error: { code: 'INVALID_STATUS', message: `Order is ${order.status}` } })
        return
      }

      const captureResult = await PayPalService.captureOrder(paypalOrderId)

      const paymentResult = await db
        .select({ id: payments.id, status: payments.status })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)

      if (paymentResult.length === 0) {
        res.status(400).json({ success: false, error: { code: 'NO_PAYMENT', message: 'No payment record found for this order' } })
        return
      }

      const paymentId = paymentResult[0].id
      const previousStatus = paymentResult[0].status

      const capture = captureResult.purchase_units?.[0]?.payments?.captures?.[0]
      const captureId = capture?.id || paypalOrderId
      const captureStatus = capture?.status || captureResult.status

      const feeAmount = capture?.seller_receivable_breakdown?.paypal_fee
        ? capture.seller_receivable_breakdown.paypal_fee.value
        : undefined

      if (captureStatus === 'COMPLETED') {
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: 'succeeded',
              transactionId: captureId,
              feeAmount: feeAmount || null,
              rawResponse: JSON.stringify(captureResult),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId))

          await tx
            .update(orders)
            .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
            .where(eq(orders.id, orderId))

          await tx.insert(paymentEvents).values({
            id: uuidv4(),
            paymentId,
            orderId,
            eventType: 'intent_succeeded',
            provider: 'paypal',
            providerEventId: captureId,
            amount: order.total,
            currency: order.currency,
            feeAmount: feeAmount || null,
            statusBefore: previousStatus,
            statusAfter: 'succeeded',
            rawData: JSON.stringify({ capture_id: captureId, paypal_order_id: paypalOrderId }),
            notes: `PayPal payment captured for order #${order.orderNumber}`,
            createdAt: new Date(),
          })
        })

        OrderEmailHelper.sendOrderConfirmationEmail(orderId).catch((emailError) => {
          console.error(`Failed to send order confirmation email for order ${orderId}:`, emailError)
        })

        res.json({
          success: true,
          data: {
            orderId,
            status: 'paid',
            captureId,
            message: 'Payment captured successfully',
          },
        })
      } else if (captureStatus === 'PENDING' || captureStatus === 'PROCESSING') {
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: 'processing',
              transactionId: captureId,
              rawResponse: JSON.stringify(captureResult),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId))

          await tx.insert(paymentEvents).values({
            id: uuidv4(),
            paymentId,
            orderId,
            eventType: 'intent_succeeded',
            provider: 'paypal',
            providerEventId: captureId,
            amount: order.total,
            currency: order.currency,
            statusBefore: previousStatus,
            statusAfter: 'processing',
            rawData: JSON.stringify({ capture_id: captureId, paypal_order_id: paypalOrderId }),
            notes: `PayPal payment processing for order #${order.orderNumber}`,
            createdAt: new Date(),
          })
        })

        res.json({
          success: true,
          data: {
            orderId,
            status: 'processing',
            captureId,
            message: 'Payment is processing',
          },
        })
      } else {
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: 'failed',
              rawResponse: JSON.stringify(captureResult),
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentId))

          await tx.insert(paymentEvents).values({
            id: uuidv4(),
            paymentId,
            orderId,
            eventType: 'intent_failed',
            provider: 'paypal',
            providerEventId: captureId,
            amount: order.total,
            currency: order.currency,
            statusBefore: previousStatus,
            statusAfter: 'failed',
            rawData: JSON.stringify({ capture_id: captureId, paypal_order_id: paypalOrderId, status: captureStatus }),
            notes: `PayPal capture failed with status: ${captureStatus}`,
            createdAt: new Date(),
          })
        })

        res.status(400).json({
          success: false,
          error: { code: 'CAPTURE_FAILED', message: `PayPal capture failed with status: ${captureStatus}` },
        })
      }
    } catch (error) {
      console.error('Capture PayPal order error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to capture PayPal order' } })
    }
  },

  handlePayPalWebhook: async (req: Request, res: Response) => {
    try {
      const webhookHeaders: Record<string, string> = {}
      const headerNames = ['paypal-auth-algo', 'paypal-cert-url', 'paypal-transmission-id', 'paypal-transmission-sig', 'paypal-transmission-time']
      for (const name of headerNames) {
        const value = req.headers[name]
        if (value) {
          webhookHeaders[name] = Array.isArray(value) ? value[0] : value
        }
      }

      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)
      const event = await PayPalService.verifyWebhook(webhookHeaders, rawBody)

      switch (event.event_type) {
        case 'CHECKOUT.ORDER.APPROVED': {
          const resource = event.resource
          const paypalOrderId = resource.id
          const orderId = resource.custom_id || ''

          if (!orderId) {
            console.error('[PayPal Webhook] Missing order ID in custom_id')
            break
          }

          console.log(`[PayPal Webhook] Order approved: paypal=${paypalOrderId}, order=${orderId}`)
          break
        }

        case 'PAYMENT.CAPTURE.COMPLETED': {
          const resource = event.resource
          const captureId = resource.id
          const orderId = resource.custom_id || ''

          if (!orderId) {
            console.error('[PayPal Webhook] Missing order ID in custom_id')
            break
          }

          const paymentResult = await db
            .select({ id: payments.id, status: payments.status })
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1)

          if (paymentResult.length > 0) {
            const paymentId = paymentResult[0].id
            const previousStatus = paymentResult[0].status

            const feeAmount = resource.seller_receivable_breakdown?.paypal_fee?.value

            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({
                  status: 'succeeded',
                  transactionId: captureId,
                  feeAmount: feeAmount || null,
                  rawResponse: JSON.stringify(resource),
                  updatedAt: new Date(),
                })
                .where(eq(payments.id, paymentId))

              await tx
                .update(orders)
                .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
                .where(eq(orders.id, orderId))

              await tx.insert(paymentEvents).values({
                id: uuidv4(),
                paymentId,
                orderId,
                eventType: 'intent_succeeded',
                provider: 'paypal',
                providerEventId: captureId,
                amount: resource.amount?.value || null,
                currency: resource.amount?.currency_code || null,
                feeAmount: feeAmount || null,
                statusBefore: previousStatus,
                statusAfter: 'succeeded',
                rawData: JSON.stringify({ capture_id: captureId }),
                notes: 'PayPal webhook: PAYMENT.CAPTURE.COMPLETED',
                createdAt: new Date(),
              })
            })

            console.log(`[PayPal Webhook] Capture completed: order=${orderId}, capture=${captureId}`)
            
            OrderEmailHelper.sendOrderConfirmationEmail(orderId).catch((emailError) => {
              console.error(`Failed to send order confirmation email for order ${orderId}:`, emailError)
            })
          }
          break
        }

        case 'PAYMENT.CAPTURE.DENIED':
        case 'PAYMENT.CAPTURE.FAILED': {
          const resource = event.resource
          const captureId = resource.id
          const orderId = resource.custom_id || ''

          if (!orderId) {
            console.error('[PayPal Webhook] Missing order ID in custom_id')
            break
          }

          const paymentResult = await db
            .select({ id: payments.id, status: payments.status })
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1)

          if (paymentResult.length > 0) {
            const paymentId = paymentResult[0].id
            const previousStatus = paymentResult[0].status

            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({
                  status: 'failed',
                  rawResponse: JSON.stringify(resource),
                  updatedAt: new Date(),
                })
                .where(eq(payments.id, paymentId))

              await tx.insert(paymentEvents).values({
                id: uuidv4(),
                paymentId,
                orderId,
                eventType: 'intent_failed',
                provider: 'paypal',
                providerEventId: captureId,
                amount: resource.amount?.value || null,
                currency: resource.amount?.currency_code || null,
                statusBefore: previousStatus,
                statusAfter: 'failed',
                rawData: JSON.stringify({ capture_id: captureId, event_type: event.event_type }),
                notes: `PayPal webhook: ${event.event_type}`,
                createdAt: new Date(),
              })
            })

            console.log(`[PayPal Webhook] Capture failed: order=${orderId}, event=${event.event_type}`)
          }
          break
        }

        case 'PAYMENT.CAPTURE.REFUNDED': {
          const resource = event.resource
          const captureId = resource.id
          const orderId = resource.custom_id || ''

          if (!orderId) {
            console.error('[PayPal Webhook] Missing order ID in custom_id')
            break
          }

          const paymentResult = await db
            .select({ id: payments.id, orderId: payments.orderId, status: payments.status })
            .from(payments)
            .where(eq(payments.orderId, orderId))
            .limit(1)

          if (paymentResult.length > 0) {
            const paymentId = paymentResult[0].id
            const previousStatus = paymentResult[0].status

            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({ status: 'refunded', updatedAt: new Date() })
                .where(eq(payments.id, paymentId))

              await tx
                .update(orders)
                .set({ status: 'refunded', updatedAt: new Date() })
                .where(eq(orders.id, orderId))

              await tx.insert(paymentEvents).values({
                id: uuidv4(),
                paymentId,
                orderId,
                eventType: 'refund_succeeded',
                provider: 'paypal',
                providerEventId: captureId,
                amount: resource.amount?.value || null,
                currency: resource.amount?.currency_code || null,
                statusBefore: previousStatus,
                statusAfter: 'refunded',
                rawData: JSON.stringify({ capture_id: captureId }),
                notes: 'PayPal webhook: PAYMENT.CAPTURE.REFUNDED',
                createdAt: new Date(),
              })
            })

            console.log(`[PayPal Webhook] Refund completed: order=${orderId}`)
          }
          break
        }

        default: {
          console.log(`[PayPal Webhook] Unhandled event: ${event.event_type}`)
        }
      }

      res.json({ success: true, received: true })
    } catch (error) {
      console.error('[PayPal Webhook] Processing error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } })
    }
  },

  syncPaymentStatus: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const { orderId } = req.body

      if (!orderId) {
        res.status(400).json({ success: false, error: { code: 'MISSING_ORDER_ID', message: 'orderId is required' } })
        return
      }

      const orderResult = await db
        .select({
          id: orders.id,
          status: orders.status,
        })
        .from(orders)
        .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
        .limit(1)

      if (orderResult.length === 0) {
        res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Order not found' } })
        return
      }

      const order = orderResult[0]

      const paymentResult = await db
        .select({ id: payments.id, status: payments.status, provider: payments.provider, transactionId: payments.transactionId })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)

      if (paymentResult.length === 0) {
        res.status(400).json({ success: false, error: { code: 'NO_PAYMENT', message: 'No payment record found' } })
        return
      }

      const payment = paymentResult[0]
      let newStatus = order.status
      let newPaymentStatus = payment.status
      let message = ''

      if (payment.provider === 'paypal' && payment.transactionId) {
        try {
          const paypalOrder = await PayPalService.getOrder(payment.transactionId)
          if (paypalOrder.status === 'COMPLETED') {
            if (payment.status !== 'succeeded' || order.status !== 'paid') {
              await db.transaction(async (tx) => {
                await tx
                  .update(payments)
                  .set({ status: 'succeeded', updatedAt: new Date() })
                  .where(eq(payments.id, payment.id))

                await tx
                  .update(orders)
                  .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
                  .where(eq(orders.id, orderId))

                await tx.insert(paymentEvents).values({
                  id: uuidv4(),
                  paymentId: payment.id,
                  orderId,
                  eventType: 'status_synced',
                  provider: 'paypal',
                  providerEventId: paypalOrder.id,
                  statusBefore: payment.status,
                  statusAfter: 'succeeded',
                  rawData: JSON.stringify(paypalOrder),
                  notes: 'Payment status synced from PayPal',
                  createdAt: new Date(),
                })
              })
              newStatus = 'paid'
              newPaymentStatus = 'succeeded'
              message = 'Payment status updated to paid'
            } else {
              message = 'Payment is already paid'
            }
          } else if (paypalOrder.status === 'CANCELLED') {
            if (payment.status !== 'failed' || order.status !== 'cancelled') {
              await db.transaction(async (tx) => {
                await tx
                  .update(payments)
                  .set({ status: 'failed', updatedAt: new Date() })
                  .where(eq(payments.id, payment.id))

                await tx.insert(paymentEvents).values({
                  id: uuidv4(),
                  paymentId: payment.id,
                  orderId,
                  eventType: 'status_synced',
                  provider: 'paypal',
                  providerEventId: paypalOrder.id,
                  statusBefore: payment.status,
                  statusAfter: 'failed',
                  rawData: JSON.stringify(paypalOrder),
                  notes: 'Payment cancelled',
                  createdAt: new Date(),
                })
              })
              newPaymentStatus = 'failed'
              message = 'Payment was cancelled'
            } else {
              message = 'Payment is already cancelled'
            }
          } else {
            message = `Payment is still ${paypalOrder.status.toLowerCase()}`
          }
        } catch (paypalError) {
          console.error('Failed to sync PayPal status:', paypalError)
          const errorMsg = paypalError instanceof Error ? paypalError.message : 'Unknown error'
          message = `Sync failed: ${errorMsg}`
        }
      } else if (!payment.transactionId) {
        message = 'No PayPal transaction ID found'
      } else {
        message = 'Unsupported payment provider for sync'
      }

      res.json({
        success: true,
        data: {
          orderId,
          status: newStatus,
          paymentStatus: newPaymentStatus,
          provider: payment.provider,
          message,
        },
      })
    } catch (error) {
      console.error('Sync payment status error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to sync payment status' } })
    }
  },

  listPaymentEvents: async (req: Request, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1
      const limit = parseInt(req.query.limit as string) || 20
      const orderId = req.query.orderId as string
      const orderNumber = req.query.orderNumber as string
      const eventType = req.query.eventType as string
      const offset = (page - 1) * limit

      const conditions: any[] = []
      if (orderId) {
        conditions.push(eq(paymentEvents.orderId, orderId))
      }
      if (orderNumber) {
        conditions.push(like(orders.orderNumber, `%${orderNumber}%`))
      }
      if (eventType && eventType !== 'all') {
        conditions.push(eq(paymentEvents.eventType, eventType as any))
      }

      const eventList = await db
        .select({
          id: paymentEvents.id,
          paymentId: paymentEvents.paymentId,
          orderId: paymentEvents.orderId,
          orderNumber: orders.orderNumber,
          eventType: paymentEvents.eventType,
          provider: paymentEvents.provider,
          providerEventId: paymentEvents.providerEventId,
          amount: paymentEvents.amount,
          currency: paymentEvents.currency,
          feeAmount: paymentEvents.feeAmount,
          statusBefore: paymentEvents.statusBefore,
          statusAfter: paymentEvents.statusAfter,
          notes: paymentEvents.notes,
          createdAt: paymentEvents.createdAt,
        })
        .from(paymentEvents)
        .leftJoin(orders, eq(paymentEvents.orderId, orders.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(paymentEvents.createdAt))
        .limit(limit)
        .offset(offset)

      const countResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(paymentEvents)
        .leftJoin(orders, eq(paymentEvents.orderId, orders.id))
        .where(conditions.length > 0 ? and(...conditions) : undefined)
      const total = Number(countResult[0]?.count || 0)

      res.json({
        success: true,
        data: {
          events: eventList,
          pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
        },
      })
    } catch (error) {
      console.error('List payment events error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to list payment events' } })
    }
  },
}