import * as crypto from 'crypto'
import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'

const AIRWALLEX_API_BASE = 'https://api.airwallex.com'

function getAirwallexDomain(): string {
  const mode = getCachedSetting('airwallex_mode') || env.AIRWALLEX_MODE || 'sandbox'
  if (mode === 'production' || mode === 'live') {
    return 'https://api.airwallex.com'
  }
  return 'https://api-sandbox.airwallex.com'
}

async function resolveClientId(): Promise<string> {
  const cached = getCachedSetting('airwallex_client_id')
  if (cached) return cached
  const fresh = await getSetting('airwallex_client_id')
  if (fresh) return fresh
  return process.env.AIRWALLEX_CLIENT_ID || ''
}

async function resolveApiKey(): Promise<string> {
  const cached = getCachedSetting('airwallex_api_key')
  if (cached) return cached
  const fresh = await getSetting('airwallex_api_key')
  if (fresh) return fresh
  return process.env.AIRWALLEX_API_KEY || ''
}

async function resolveWebhookSigningKey(): Promise<string> {
  const cached = getCachedSetting('airwallex_webhook_signing_key')
  if (cached) return cached
  const fresh = await getSetting('airwallex_webhook_signing_key')
  if (fresh) return fresh
  return process.env.AIRWALLEX_WEBHOOK_SIGNING_KEY || ''
}

function hmacSha256(message: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(message, 'utf8').digest('hex')
}

export interface CreateAirwallexPaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface AirwallexPaymentResult {
  paymentIntentId: string
  clientSecret: string
  redirectUrl: string
  totalAmount: string
}

export class AirwallexService {
  static async createPayment(params: CreateAirwallexPaymentParams): Promise<AirwallexPaymentResult> {
    const clientId = await resolveClientId()
    const apiKey = await resolveApiKey()

    if (!clientId) {
      throw new Error('Airwallex Client ID is not configured. Please set it in Admin Settings > Payment.')
    }
    if (!apiKey) {
      throw new Error('Airwallex API Key is not configured. Please set it in Admin Settings > Payment.')
    }

    const domain = getAirwallexDomain()
    const currency = params.currency.toUpperCase()
    const amountValue = params.amount.toFixed(2)
    const returnUrl = params.returnUrl || `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`
    const notifyUrl = params.notifyUrl || `${env.API_BASE_URL}/api/payments/airwallex/notify`

    const paymentIntentRequest = {
      request_id: `PAY_${params.orderId}_${Date.now()}`,
      amount: parseFloat(amountValue),
      currency,
      merchant_order_id: params.orderId,
      description: params.description || `AXIS O - Order #${params.orderNumber}`,
      return_url: returnUrl,
      notification_config: {
        endpoint: notifyUrl,
        method: 'POST',
      },
      language: 'en',
    }

    const response = await fetch(`${domain}/v1/pa/payment_intents/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'x-client-id': clientId,
        'x-idempotency-key': `PAY_${params.orderId}_${Date.now()}`,
      },
      body: JSON.stringify(paymentIntentRequest),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airwallex create payment failed: ${response.status} ${errorText}`)
    }

    const data = await response.json() as {
      id?: string
      client_secret?: string
      status?: string
      return_url?: string
      amount?: number
      currency?: string
      error?: { message?: string }
    }

    if (data.error) {
      throw new Error(`Airwallex payment creation failed: ${data.error.message}`)
    }

    const paymentIntentId = data.id || `PAY_${params.orderId}_${Date.now()}`
    const clientSecret = data.client_secret || ''

    let redirectUrl = data.return_url || ''
    if (!redirectUrl && clientSecret) {
      redirectUrl = `${domain}/v1/pa/payment_intents/${paymentIntentId}/continue` as string
    }

    return {
      paymentIntentId,
      clientSecret,
      redirectUrl,
      totalAmount: amountValue,
    }
  }

  static async inquiryPayment(paymentIntentId: string): Promise<{ paymentStatus: string; resultCode: string }> {
    const apiKey = await resolveApiKey()
    if (!apiKey) {
      throw new Error('Airwallex API Key not configured')
    }

    const domain = getAirwallexDomain()

    const response = await fetch(`${domain}/v1/pa/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
      },
    })

    if (!response.ok) {
      throw new Error(`Airwallex inquiry failed: ${response.status}`)
    }

    const data = await response.json() as {
      id?: string
      status?: string
      amount?: number
      currency?: string
    }

    let paymentStatus = 'unknown'
    if (data.status === 'succeeded') paymentStatus = 'SUCCESS'
    else if (data.status === 'failed') paymentStatus = 'FAILURE'
    else if (data.status === 'pending' || data.status === 'requires_payment_method') paymentStatus = 'PENDING'
    else if (data.status === 'cancelled') paymentStatus = 'CANCELLED'

    return {
      paymentStatus,
      resultCode: data.status || 'UNKNOWN',
    }
  }

  static async createRefund(paymentIntentId: string, refundAmount: number, currency: string): Promise<{ id: string; status: string | null }> {
    const apiKey = await resolveApiKey()
    if (!apiKey) {
      throw new Error('Airwallex API Key not configured')
    }

    const domain = getAirwallexDomain()
    const refundRequestId = `REF_${paymentIntentId}_${Date.now()}`

    const response = await fetch(`${domain}/v1/pa/refunds/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'x-api-key': apiKey,
        'x-idempotency-key': refundRequestId,
      },
      body: JSON.stringify({
        request_id: refundRequestId,
        payment_intent_id: paymentIntentId,
        amount: {
          amount: parseFloat(refundAmount.toFixed(2)),
          currency: currency.toUpperCase(),
        },
        reason: 'Merchant initiated refund',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Airwallex refund failed: ${response.status} ${errorText}`)
    }

    const data = await response.json() as {
      id?: string
      status?: string
      error?: { message?: string }
    }

    if (data.error) {
      throw new Error(`Airwallex refund failed: ${data.error.message}`)
    }

    let status: string | null = null
    if (data.status === 'SUCCESS') status = 'succeeded'
    else if (data.status === 'FAILED') status = 'failed'
    else if (data.status === 'PENDING') status = 'pending'

    return { id: data.id || refundRequestId, status }
  }

  static verifyWebhookSignature(payload: string, signature: string, timestamp: string, signingKey: string): boolean {
    try {
      const message = `${timestamp}.${payload}`
      const expectedSig = hmacSha256(message, signingKey)
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))
    } catch {
      return false
    }
  }
}
