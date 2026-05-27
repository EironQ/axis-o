import Stripe from 'stripe'
import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'

let stripeInstance: Stripe | null = null
let instanceKey: string = ''

async function resolveSecretKey(): Promise<string> {
  const dbKey = getCachedSetting('stripe_secret_key')
  if (dbKey) return dbKey
  const freshKey = await getSetting('stripe_secret_key')
  if (freshKey) return freshKey
  return env.STRIPE_SECRET_KEY
}

async function resolveWebhookSecret(): Promise<string> {
  const dbKey = getCachedSetting('stripe_webhook_secret')
  if (dbKey) return dbKey
  const freshKey = await getSetting('stripe_webhook_secret')
  if (freshKey) return freshKey
  return env.STRIPE_WEBHOOK_SECRET
}

async function getStripe(): Promise<Stripe> {
  const key = await resolveSecretKey()
  if (!key) {
    throw new Error('STRIPE_SECRET_KEY is not configured. Please set it in Admin Settings > Payment.')
  }

  if (!stripeInstance || key !== instanceKey) {
    stripeInstance = new Stripe(key, {
      typescript: true,
    })
    instanceKey = key
  }

  return stripeInstance
}

export async function getStripePublishableKey(): Promise<string> {
  const cached = getCachedSetting('stripe_public_key')
  if (cached) return cached
  const fresh = await getSetting('stripe_public_key')
  return fresh || env.STRIPE_PUBLISHABLE_KEY
}

export interface CreatePaymentIntentParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  customerEmail?: string
  description?: string
  metadata?: Record<string, string>
}

export interface PaymentIntentResult {
  paymentIntentId: string
  clientSecret: string
  status: string
}

export class StripeService {
  static async createPaymentIntent(params: CreatePaymentIntentParams): Promise<PaymentIntentResult> {
    const stripe = await getStripe()

    const amountInCents = Math.round(params.amount * 100)

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: 'usd',
      description: params.description || `Order #${params.orderNumber}`,
      receipt_email: params.customerEmail,
      metadata: {
        orderId: params.orderId,
        orderNumber: params.orderNumber,
        originalAmount: params.amount.toString(),
        originalCurrency: params.currency,
        ...params.metadata,
      },
      automatic_payment_methods: {
        enabled: true,
      },
    })

    if (!paymentIntent.client_secret) {
      throw new Error('Failed to create payment intent: missing client_secret')
    }

    return {
      paymentIntentId: paymentIntent.id,
      clientSecret: paymentIntent.client_secret,
      status: paymentIntent.status,
    }
  }

  static async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = await getStripe()
    return stripe.paymentIntents.retrieve(paymentIntentId)
  }

  static async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    const stripe = await getStripe()
    try {
      return await stripe.paymentIntents.cancel(paymentIntentId)
    } catch (err) {
      console.warn(`[Stripe] Failed to cancel PaymentIntent ${paymentIntentId}:`, err)
      throw err
    }
  }

  static async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    const stripe = await getStripe()

    const refundParams: Stripe.RefundCreateParams = {
      payment_intent: paymentIntentId,
    }

    if (amount !== undefined) {
      refundParams.amount = Math.round(amount * 100)
    }

    return stripe.refunds.create(refundParams)
  }

  static async constructWebhookEvent(payload: string | Buffer, signature?: string): Promise<Stripe.Event> {
    const webhookSecret = await resolveWebhookSecret()

    if (webhookSecret && signature) {
      const stripe = await getStripe()
      return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    }

    console.warn('[Stripe] Webhook signature verification skipped - no webhook secret configured. Set it in Admin Settings > Payment for production.')
    const rawBody = Buffer.isBuffer(payload) ? payload.toString('utf-8') : payload
    return JSON.parse(rawBody) as Stripe.Event
  }
}
