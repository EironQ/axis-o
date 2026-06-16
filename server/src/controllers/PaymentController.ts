import { Request, Response } from 'express'
import { db } from '../config/database'
import { orders, payments, paymentEvents, users } from '../db/schema'
import { eq, and, desc, like, or, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'
import { StripeService, getStripePublishableKey } from '../services/payment/stripe'
import { PayPalService, getPayPalClientId } from '../services/payment/paypal'
import { AirwallexService } from '../services/payment/airwallex'
import { LianlianpayService } from '../services/payment/lianlianpay'
import { OrderEmailHelper } from '../services/orderEmailHelper'
import { getCachedSetting, getSetting } from '../services/settingsCache'

type EventType = 'intent_created' | 'intent_succeeded' | 'intent_failed' | 'intent_canceled' | 'refund_requested' | 'refund_succeeded' | 'refund_failed' | 'status_synced' | 'webhook_received'

interface EventLogParams {
  paymentId: string
  orderId: string
  eventType: EventType
  provider: 'stripe' | 'paypal' | 'airwallex' | 'lianlianpay'
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

function extractFee(paymentIntent: any): string | undefined {
  if (paymentIntent.latest_charge && typeof paymentIntent.latest_charge === 'object') {
    const charge = paymentIntent.latest_charge as any
    const balanceTransaction = charge.balance_transaction
    if (typeof balanceTransaction === 'object' && balanceTransaction?.fee_details?.[0]?.amount) {
      return (balanceTransaction.fee_details[0].amount / 100).toFixed(2)
    }
  }
  return undefined
}

async function syncPaymentIntentToDatabase(
  paymentIntent: any,
  paymentId: string,
  order: { id: string; total: string | number; orderNumber: string }
): Promise<void> {
  if (paymentIntent.status === 'succeeded') {
    const calculatedFee = extractFee(paymentIntent)
    await db.transaction(async (tx) => {
      await tx
        .update(payments)
        .set({
          status: 'succeeded',
          feeAmount: calculatedFee,
          rawResponse: JSON.stringify(paymentIntent),
          updatedAt: new Date(),
        })
        .where(eq(payments.id, paymentId))

      await tx
        .update(orders)
        .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
        .where(eq(orders.id, order.id))

      await tx.insert(paymentEvents).values({
        id: uuidv4(),
        paymentId,
        orderId: order.id,
        eventType: 'intent_succeeded',
        provider: 'stripe',
        providerEventId: paymentIntent.id,
        amount: (paymentIntent.amount / 100).toFixed(2),
        currency: paymentIntent.currency,
        feeAmount: calculatedFee,
        statusBefore: 'pending',
        statusAfter: 'succeeded',
        rawData: JSON.stringify({ id: paymentIntent.id, payment_method: paymentIntent.payment_method }),
        notes: 'Payment confirmed via intent sync',
        createdAt: new Date(),
      })
    })

    OrderEmailHelper.sendOrderConfirmationEmail(order.id).catch((emailError) => {
      console.error(`Failed to send order confirmation email for order ${order.id}:`, emailError)
    })
  } else if (paymentIntent.status === 'processing') {
    await db.update(payments)
      .set({ status: 'processing', updatedAt: new Date() })
      .where(eq(payments.id, paymentId))

    await db.insert(paymentEvents).values({
      id: uuidv4(),
      paymentId,
      orderId: order.id,
      eventType: 'status_synced',
      provider: 'stripe',
      providerEventId: paymentIntent.id,
      amount: (paymentIntent.amount / 100).toFixed(2),
      currency: paymentIntent.currency,
      statusBefore: 'pending',
      statusAfter: 'processing',
      notes: 'Sync: payment is processing',
      createdAt: new Date(),
    })
  }
}

export const PaymentController = {
  createPaymentIntent: async (req: Request, res: Response) => {
    try {
      const userId = req.user!.userId
      const orderId = req.params.orderId as string
      const provider = (req.query.provider as string) || 'stripe'

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
          if (provider === 'stripe' && existingPayment[0].transactionId && existingPayment[0].provider === 'stripe') {
            const paymentIntent = await StripeService.retrievePaymentIntent(existingPayment[0].transactionId)
            if (paymentIntent.status === 'requires_payment_method') {
              await StripeService.cancelPaymentIntent(existingPayment[0].transactionId)
              const newStripeResult = await StripeService.createPaymentIntent({
                orderId,
                orderNumber: order.orderNumber,
                amount: parseFloat(order.total.toString()),
                currency: 'USD',
                description: `AXIS O - Order #${order.orderNumber}`,
              })
              await db.update(payments)
                .set({ transactionId: newStripeResult.paymentIntentId, updatedAt: new Date() })
                .where(eq(payments.id, existingPayment[0].id))
              res.json({
                success: true,
                data: {
                  paymentId: existingPayment[0].id,
                  orderId,
                  orderNumber: order.orderNumber,
                  amount: parseFloat(order.total.toString()),
                  currency: 'USD',
                  publishableKey: await getStripePublishableKey(),
                  clientSecret: newStripeResult.clientSecret,
                },
              })
              return
            }
            if (paymentIntent.status === 'succeeded' || paymentIntent.status === 'processing') {
              try {
                await syncPaymentIntentToDatabase(paymentIntent, existingPayment[0].id, order)
              } catch (syncErr) {
                console.error('[Payment] Failed to sync paid intent to DB:', syncErr)
              }
              res.json({
                success: true,
                data: {
                  paymentId: existingPayment[0].id,
                  orderId,
                  orderNumber: order.orderNumber,
                  amount: parseFloat(order.total.toString()),
                  currency: 'USD',
                  publishableKey: await getStripePublishableKey(),
                  clientSecret: paymentIntent.client_secret,
                  alreadyPaid: true,
                },
              })
              return
            }
            res.json({
              success: true,
              data: {
                paymentId: existingPayment[0].id,
                orderId,
                orderNumber: order.orderNumber,
                amount: parseFloat(order.total.toString()),
                currency: 'USD',
                publishableKey: await getStripePublishableKey(),
                clientSecret: paymentIntent.client_secret,
              },
            })
            return
          }
          if (provider === 'paypal' && existingPayment[0].transactionId && existingPayment[0].provider === 'paypal') {
            res.json({
              success: true,
              data: {
                paymentId: existingPayment[0].id,
                orderId,
                orderNumber: order.orderNumber,
                amount: parseFloat(order.total.toString()),
                currency: 'USD',
                publishableKey: await getPayPalClientId(),
                clientSecret: '',
                paypalOrderId: existingPayment[0].transactionId,
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

      if (provider === 'airwallex') {
        const airwallexResult = await AirwallexService.createPayment({
          orderId,
          orderNumber: order.orderNumber,
          amount: parseFloat(order.total.toString()),
          currency: order.currency,
          description: `AXIS O - Order #${order.orderNumber}`,
        })

        const paymentData = {
          id: paymentId,
          orderId,
          provider: 'airwallex' as const,
          transactionId: airwallexResult.paymentIntentId,
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
          provider: 'airwallex',
          providerEventId: airwallexResult.paymentIntentId,
          amount: order.total,
          currency: order.currency,
          statusAfter: 'pending',
          notes: `Airwallex payment created for order #${order.orderNumber}`,
        })

        res.json({
          success: true,
          data: {
            paymentId,
            orderId,
            orderNumber: order.orderNumber,
            amount: parseFloat(order.total.toString()),
            currency: order.currency,
            publishableKey: '',
            clientSecret: airwallexResult.clientSecret,
            paypalOrderId: '',
            airwallexRedirectUrl: airwallexResult.redirectUrl,
          },
        })
        return
      }

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
              publishableKey: await getPayPalClientId(),
              clientSecret: '',
              paypalOrderId: paypalResult.paypalOrderId,
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
              publishableKey: '',
              clientSecret: '',
              paypalOrderId: '',
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

      const stripeResult = await StripeService.createPaymentIntent({
        orderId,
        orderNumber: order.orderNumber,
        amount: parseFloat(order.total.toString()),
        currency: 'USD',
        description: `AXIS O - Order #${order.orderNumber}`,
      })

      const paymentData = {
        id: paymentId,
        orderId,
        provider: 'stripe' as const,
        transactionId: stripeResult.paymentIntentId,
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
        provider: 'stripe',
        providerEventId: stripeResult.paymentIntentId,
        amount: order.total,
        currency: order.currency,
        statusAfter: 'pending',
        notes: `PaymentIntent created for order #${order.orderNumber}`,
      })

      res.json({
        success: true,
        data: {
          paymentId,
          orderId,
          orderNumber: order.orderNumber,
          amount: parseFloat(order.total.toString()),
          currency: 'USD',
          publishableKey: await getStripePublishableKey(),
          clientSecret: stripeResult.clientSecret,
          paypalOrderId: '',
        },
      })
    } catch (error) {
      console.error('Create payment intent error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to create payment intent' } })
    }
  },

  handleWebhook: async (req: Request, res: Response) => {
    try {
      const signature = req.headers['stripe-signature'] as string | undefined
      const rawBody = req.body
      const event = await StripeService.constructWebhookEvent(rawBody, signature)

      switch (event.type) {
        case 'payment_intent.succeeded': {
          const paymentIntent = event.data.object
          const orderId = paymentIntent.metadata.orderId

          if (!orderId) {
            console.error('Webhook: missing orderId in payment intent metadata')
            break
          }

          const paymentResult = await db
            .select({ id: payments.id, status: payments.status })
            .from(payments)
            .where(eq(payments.transactionId, paymentIntent.id))
            .limit(1)

          if (paymentResult.length > 0) {
            const paymentId = paymentResult[0].id
            const previousStatus = paymentResult[0].status
            const calculatedFee = extractFee(paymentIntent)

            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({
                  status: 'succeeded',
                  feeAmount: calculatedFee,
                  rawResponse: JSON.stringify(paymentIntent),
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
                provider: 'stripe',
                providerEventId: paymentIntent.id,
                amount: (paymentIntent.amount / 100).toFixed(2),
                currency: paymentIntent.currency,
                feeAmount: calculatedFee,
                statusBefore: previousStatus,
                statusAfter: 'succeeded',
                rawData: JSON.stringify({ id: paymentIntent.id, payment_method: paymentIntent.payment_method }),
                notes: 'Stripe webhook: payment_intent.succeeded',
                createdAt: new Date(),
              })
            })

            console.log(`Payment succeeded: order=${orderId}, pi=${paymentIntent.id}`)
            
            OrderEmailHelper.sendOrderConfirmationEmail(orderId).catch((emailError) => {
              console.error(`Failed to send order confirmation email for order ${orderId}:`, emailError)
            })
          }
          break
        }

        case 'payment_intent.payment_failed': {
          const paymentIntent = event.data.object

          const paymentResult = await db
            .select({ id: payments.id, status: payments.status })
            .from(payments)
            .where(eq(payments.transactionId, paymentIntent.id))
            .limit(1)

          if (paymentResult.length > 0) {
            const paymentId = paymentResult[0].id
            const previousStatus = paymentResult[0].status
            const orderId = paymentIntent.metadata.orderId || ''

            await db.transaction(async (tx) => {
              await tx
                .update(payments)
                .set({
                  status: 'failed',
                  rawResponse: JSON.stringify(paymentIntent),
                  updatedAt: new Date(),
                })
                .where(eq(payments.id, paymentId))

              await tx.insert(paymentEvents).values({
                id: uuidv4(),
                paymentId,
                orderId: orderId || '',
                eventType: 'intent_failed',
                provider: 'stripe',
                providerEventId: paymentIntent.id,
                amount: (paymentIntent.amount / 100).toFixed(2),
                currency: paymentIntent.currency,
                statusBefore: previousStatus,
                statusAfter: 'failed',
                rawData: JSON.stringify({ id: paymentIntent.id, last_payment_error: paymentIntent.last_payment_error }),
                notes: paymentIntent.last_payment_error?.message || 'Payment failed',
                createdAt: new Date(),
              })
            })

            console.log(`Payment failed: pi=${paymentIntent.id}`)
          }
          break
        }

        case 'charge.refunded': {
          const charge = event.data.object as any
          const paymentIntentId = charge.payment_intent

          if (paymentIntentId) {
            const paymentResult = await db
              .select({ id: payments.id, orderId: payments.orderId, status: payments.status })
              .from(payments)
              .where(eq(payments.transactionId, paymentIntentId))
              .limit(1)

            if (paymentResult.length > 0) {
              const paymentId = paymentResult[0].id
              const orderId = paymentResult[0].orderId
              const previousStatus = paymentResult[0].status
              const isPartial = charge.amount_refunded < charge.amount
              const newStatus = isPartial ? 'partially_refunded' as const : 'refunded' as const

              await db.transaction(async (tx) => {
                await tx
                  .update(payments)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(payments.id, paymentId))

                if (!isPartial) {
                  await tx
                    .update(orders)
                    .set({ status: 'refunded', updatedAt: new Date() })
                    .where(eq(orders.id, orderId))
                }

                await tx.insert(paymentEvents).values({
                  id: uuidv4(),
                  paymentId,
                  orderId,
                  eventType: 'refund_succeeded',
                  provider: 'stripe',
                  providerEventId: charge.id,
                  amount: (charge.amount_refunded / 100).toFixed(2),
                  currency: charge.currency,
                  statusBefore: previousStatus,
                  statusAfter: newStatus,
                  rawData: JSON.stringify({ refund_id: charge.id, balance_transaction: charge.balance_transaction }),
                  notes: isPartial ? `Partial refund: ${(charge.amount_refunded / 100).toFixed(2)} ${charge.currency}` : `Full refund processed`,
                  createdAt: new Date(),
                })
              })
            }
          }
          break
        }

        case 'charge.refund.updated': {
          const charge = event.data.object as any
          const paymentIntentId = charge.payment_intent

          if (paymentIntentId) {
            const paymentResult = await db
              .select({ id: payments.id, orderId: payments.orderId, status: payments.status })
              .from(payments)
              .where(eq(payments.transactionId, paymentIntentId))
              .limit(1)

            if (paymentResult.length > 0) {
              const paymentId = paymentResult[0].id
              const orderId = paymentResult[0].orderId
              const previousStatus = paymentResult[0].status
              const isPartial = charge.amount_refunded < charge.amount
              const newStatus = isPartial ? 'partially_refunded' as const : 'refunded' as const

              await db.transaction(async (tx) => {
                await tx
                  .update(payments)
                  .set({ status: newStatus, updatedAt: new Date() })
                  .where(eq(payments.id, paymentId))

                if (!isPartial) {
                  await tx
                    .update(orders)
                    .set({ status: 'refunded', updatedAt: new Date() })
                    .where(eq(orders.id, orderId))
                }

                await tx.insert(paymentEvents).values({
                  id: uuidv4(),
                  paymentId,
                  orderId,
                  eventType: 'refund_succeeded',
                  provider: 'stripe',
                  providerEventId: charge.id,
                  amount: (charge.amount_refunded / 100).toFixed(2),
                  currency: charge.currency,
                  statusBefore: previousStatus,
                  statusAfter: newStatus,
                  rawData: JSON.stringify({ refund_id: charge.id, status: charge.status }),
                  notes: `Refund updated via webhook`,
                  createdAt: new Date(),
                })
              })
            }
          }
          break
        }

        default: {
          console.log(`Unhandled Stripe webhook event: ${event.type}`)
        }
      }

      res.json({ success: true, received: true })
    } catch (error) {
      console.error('Webhook error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Webhook processing failed' } })
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
        refund = await StripeService.createRefund(payment.transactionId)
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
        res.json({ success: true, data: { orderId, status: order.status, message: `Order is already ${order.status}` } })
        return
      }

      const paymentResult = await db
        .select({ id: payments.id, transactionId: payments.transactionId, status: payments.status })
        .from(payments)
        .where(eq(payments.orderId, orderId))
        .limit(1)

      if (paymentResult.length === 0) {
        res.status(400).json({ success: false, error: { code: 'NO_PAYMENT', message: 'No payment record found for this order' } })
        return
      }

      const payment = paymentResult[0]
      if (!payment.transactionId) {
        res.status(400).json({ success: false, error: { code: 'NO_TRANSACTION', message: 'No transaction ID found' } })
        return
      }

      try {
        const paymentIntent = await StripeService.retrievePaymentIntent(payment.transactionId)

        if (paymentIntent.status === 'succeeded') {
          const previousStatus = payment.status
          const calculatedFee = extractFee(paymentIntent)

          await db.transaction(async (tx) => {
            await tx
              .update(payments)
              .set({
                status: 'succeeded',
                feeAmount: calculatedFee,
                rawResponse: JSON.stringify(paymentIntent),
                updatedAt: new Date(),
              })
              .where(eq(payments.id, payment.id))

            await tx
              .update(orders)
              .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
              .where(eq(orders.id, orderId))

            await tx.insert(paymentEvents).values({
              id: uuidv4(),
              paymentId: payment.id,
              orderId,
              eventType: 'intent_succeeded',
              provider: 'stripe',
              providerEventId: paymentIntent.id,
              amount: (paymentIntent.amount / 100).toFixed(2),
              currency: paymentIntent.currency,
              feeAmount: calculatedFee,
              statusBefore: previousStatus,
              statusAfter: 'succeeded',
              rawData: JSON.stringify({ id: paymentIntent.id, payment_method: paymentIntent.payment_method }),
              notes: 'Payment confirmed via status sync',
              createdAt: new Date(),
            })
          })

          OrderEmailHelper.sendOrderConfirmationEmail(orderId).catch((emailError) => {
            console.error(`Failed to send order confirmation email for order ${orderId}:`, emailError)
          })

          res.json({ success: true, data: { orderId, status: 'paid', message: 'Payment confirmed' } })
          return
        }

        if (paymentIntent.status === 'processing') {
          await insertPaymentEvent({
            paymentId: payment.id,
            orderId,
            eventType: 'status_synced',
            provider: 'stripe',
            providerEventId: payment.transactionId,
            statusBefore: payment.status,
            statusAfter: payment.status,
            notes: 'Sync: payment still processing',
          })

          res.json({ success: true, data: { orderId, status: 'processing', message: 'Payment is still processing' } })
          return
        }

        await insertPaymentEvent({
          paymentId: payment.id,
          orderId,
          eventType: 'status_synced',
          provider: 'stripe',
          providerEventId: payment.transactionId,
          statusBefore: payment.status,
          statusAfter: paymentIntent.status,
          notes: `Sync complete, status: ${paymentIntent.status}`,
        })

        res.json({ success: true, data: { orderId, status: paymentIntent.status, message: `Payment status: ${paymentIntent.status}` } })
      } catch (stripeError) {
        console.error('Failed to verify payment with Stripe:', stripeError)

        await insertPaymentEvent({
          paymentId: payment.id,
          orderId,
          eventType: 'status_synced',
          provider: 'stripe',
          providerEventId: payment.transactionId,
          statusBefore: payment.status,
          statusAfter: payment.status,
          notes: 'Sync attempt failed, waiting for webhook',
        })

        res.json({
          success: true,
          data: { orderId, status: 'pending', message: 'Could not verify payment with Stripe, please wait for webhook confirmation' },
        })
      }
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

  handleAirwallexNotify: async (req: Request, res: Response) => {
    try {
      const rawBody = typeof req.body === 'string' ? req.body : JSON.stringify(req.body)

      console.log('[Airwallex Notify] Received notification:', rawBody)

      const timestamp = (req.headers['x-airwallex-timestamp'] as string) || ''
      const signature = (req.headers['x-airwallex-signature'] as string) || ''

      const signingKey = await (async () => {
        const cached = getCachedSetting('airwallex_webhook_signing_key')
        if (cached) return cached
        const fresh = await getSetting('airwallex_webhook_signing_key')
        return fresh || ''
      })()

      if (signingKey && timestamp && signature) {
        const verified = AirwallexService.verifyWebhookSignature(rawBody, signature, timestamp, signingKey)
        if (!verified) {
          console.error('[Airwallex Notify] Signature verification failed')
          res.status(400).json({ result: { resultCode: 'SIGNATURE_FAILED', resultMessage: 'signature verification failed', resultStatus: 'F' } })
          return
        }
      }

      const event = JSON.parse(rawBody) as {
        id?: string
        event_type?: string
        created_at?: string
        data?: {
          object?: {
            id?: string
            status?: string
            amount?: number
            currency?: string
            merchant_order_id?: string
            payment_method_id?: string
          }
        }
      }

      const paymentIntentId = event.data?.object?.id || event.id || ''
      const paymentStatus = event.data?.object?.status || ''
      const currency = event.data?.object?.currency || 'USD'
      const amountValue = event.data?.object?.amount?.toFixed(2) || ''

      if (!paymentIntentId) {
        console.error('[Airwallex Notify] Missing payment intent id')
        res.status(400).json({ result: { resultCode: 'MISSING_ID', resultMessage: 'missing payment intent id', resultStatus: 'F' } })
        return
      }

      const paymentResult = await db
        .select({
          id: payments.id,
          status: payments.status,
          orderId: payments.orderId,
        })
        .from(payments)
        .where(eq(payments.transactionId, paymentIntentId))
        .limit(1)

      if (paymentResult.length === 0) {
        console.error(`[Airwallex Notify] No payment record found for paymentIntentId ${paymentIntentId}`)
        res.status(400).json({ result: { resultCode: 'NOT_FOUND', resultMessage: 'payment not found', resultStatus: 'F' } })
        return
      }

      const { id: paymentRecordId, status: previousStatus, orderId } = paymentResult[0]

      if (event.event_type === 'payment_intent.succeeded' || paymentStatus === 'succeeded') {
        if (previousStatus === 'succeeded') {
          res.json({ result: { resultCode: 'SUCCESS', resultMessage: 'success', resultStatus: 'S' } })
          return
        }

        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: 'succeeded',
              rawResponse: rawBody,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentRecordId))

          await tx
            .update(orders)
            .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
            .where(eq(orders.id, orderId))

          await tx.insert(paymentEvents).values({
            id: uuidv4(),
            paymentId: paymentRecordId,
            orderId,
            eventType: 'intent_succeeded',
            provider: 'airwallex',
            providerEventId: paymentIntentId,
            amount: amountValue || null,
            currency,
            statusBefore: previousStatus,
            statusAfter: 'succeeded',
            rawData: rawBody,
            notes: 'Airwallex webhook: payment succeeded',
            createdAt: new Date(),
          })
        })

        console.log(`[Airwallex Notify] Payment succeeded: order=${orderId}, paymentIntentId=${paymentIntentId}`)
      } else if (event.event_type === 'payment_intent.failed' || paymentStatus === 'failed') {
        await db.transaction(async (tx) => {
          await tx
            .update(payments)
            .set({
              status: 'failed',
              rawResponse: rawBody,
              updatedAt: new Date(),
            })
            .where(eq(payments.id, paymentRecordId))

          await tx.insert(paymentEvents).values({
            id: uuidv4(),
            paymentId: paymentRecordId,
            orderId,
            eventType: 'intent_failed',
            provider: 'airwallex',
            providerEventId: paymentIntentId,
            amount: amountValue || null,
            currency,
            statusBefore: previousStatus,
            statusAfter: 'failed',
            rawData: rawBody,
            notes: `Airwallex notification: payment failed`,
            createdAt: new Date(),
          })
        })

        console.log(`[Airwallex Notify] Payment failed: order=${orderId}, paymentIntentId=${paymentIntentId}`)
      } else {
        console.log(`[Airwallex Notify] Unhandled event type / status: ${event.event_type} / ${paymentStatus}`)
      }

      res.json({ result: { resultCode: 'SUCCESS', resultMessage: 'success', resultStatus: 'S' } })
    } catch (error) {
      console.error('[Airwallex Notify] Processing error:', error)
      res.status(500).json({ result: { resultCode: 'ERROR', resultMessage: 'internal error', resultStatus: 'F' } })
    }
  },
}