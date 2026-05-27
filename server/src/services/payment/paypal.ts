import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'

interface PayPalAccessToken {
  access_token: string
  token_type: string
  expires_in: number
}

interface PayPalOrderResponse {
  id: string
  status: string
  links: Array<{ href: string; rel: string; method: string }>
}

interface PayPalCaptureResponse {
  id: string
  status: string
  purchase_units: Array<{
    payments: {
      captures: Array<{
        id: string
        status: string
        amount: { value: string; currency_code: string }
        seller_receivable_breakdown?: {
          net_amount?: { value: string; currency_code: string }
          paypal_fee?: { value: string; currency_code: string }
        }
      }>
    }
  }>
}

interface PayPalRefundResponse {
  id: string
  status: string
  amount: { value: string; currency_code: string }
}

interface PayPalWebhookEvent {
  id: string
  event_type: string
  resource: {
    id?: string
    status?: string
    custom_id?: string
    amount?: { value: string; currency_code: string }
    seller_receivable_breakdown?: {
      paypal_fee?: { value: string; currency_code: string }
    }
  } & Record<string, unknown>
  create_time: string
}

let accessTokenCache: { token: string; expiresAt: number } | null = null

async function resolveClientId(): Promise<string> {
  const cached = getCachedSetting('paypal_client_id')
  if (cached) return cached
  const fresh = await getSetting('paypal_client_id')
  return fresh || env.PAYPAL_CLIENT_ID
}

async function resolveClientSecret(): Promise<string> {
  const cached = getCachedSetting('paypal_client_secret')
  if (cached) return cached
  const fresh = await getSetting('paypal_client_secret')
  return fresh || env.PAYPAL_CLIENT_SECRET
}

function isSandbox(): boolean {
  const cached = getCachedSetting('paypal_mode')
  if (cached === 'live' || cached === 'sandbox') return cached === 'sandbox'
  return env.PAYPAL_MODE !== 'live'
}

function getBaseUrl(): string {
  return isSandbox()
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com'
}

export async function getPayPalClientId(): Promise<string> {
  const publised = getCachedSetting('paypal_client_id')
  if (publised) return publised
  const fresh = await getSetting('paypal_client_id')
  return fresh || env.PAYPAL_CLIENT_ID
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (accessTokenCache && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token
  }

  const clientId = await resolveClientId()
  const clientSecret = await resolveClientSecret()

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured. Please set them in Admin Settings > Payment.')
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  const response = await fetch(`${getBaseUrl()}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`PayPal OAuth failed: ${response.status} ${errorText}`)
  }

  const data = (await response.json()) as PayPalAccessToken
  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  }

  return data.access_token
}

export interface CreatePayPalOrderParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  description?: string
}

export interface PayPalOrderResult {
  paypalOrderId: string
  status: string
}

function convertCurrency(amount: number, _currency: string): { amount: string; currency: string } {
  return { amount: amount.toFixed(2), currency: 'USD' }
}

export class PayPalService {
  static async createOrder(params: CreatePayPalOrderParams): Promise<PayPalOrderResult> {
    const accessToken = await getAccessToken()

    const { amount: amountStr, currency } = convertCurrency(params.amount, params.currency)

    const body = {
      intent: 'CAPTURE' as const,
      purchase_units: [
        {
          reference_id: params.orderId,
          description: params.description || `AXIS O - Order #${params.orderNumber}`,
          custom_id: params.orderId,
          amount: {
            currency_code: currency,
            value: amountStr,
            breakdown: {
              item_total: {
                currency_code: currency,
                value: amountStr,
              },
            },
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
            landing_page: 'LOGIN',
            user_action: 'PAY_NOW',
            return_url: `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`,
            cancel_url: `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`,
          },
        },
      },
    }

    const response = await fetch(`${getBaseUrl()}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'PayPal-Request-Id': `${params.orderId}-${Date.now()}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal create order failed: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as PayPalOrderResponse

    return {
      paypalOrderId: data.id,
      status: data.status,
    }
  }

  static async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal capture order failed: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as PayPalCaptureResponse
    return data
  }

  static async getOrder(paypalOrderId: string): Promise<PayPalOrderResponse> {
    const accessToken = await getAccessToken()

    const response = await fetch(`${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal get order failed: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as PayPalOrderResponse
    return data
  }

  static async createRefund(captureId: string, amount?: number, currency?: string): Promise<PayPalRefundResponse> {
    const accessToken = await getAccessToken()

    const body: Record<string, unknown> = {}
    if (amount !== undefined && currency) {
      body.amount = {
        value: amount.toFixed(2),
        currency_code: currency.toUpperCase(),
      }
    }

    const response = await fetch(`${getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify(body),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`PayPal refund failed: ${response.status} ${errorText}`)
    }

    const data = (await response.json()) as PayPalRefundResponse
    return data
  }

  static async verifyWebhook(headers: Record<string, string>, body: string): Promise<PayPalWebhookEvent> {
    const webhookId = getCachedSetting('paypal_webhook_id') || env.PAYPAL_WEBHOOK_ID || ''

    if (webhookId) {
      try {
        const accessToken = await getAccessToken()
        const verificationBody = {
          webhook_id: webhookId,
          event_body: JSON.parse(body),
          headers: {
            'PAYPAL-AUTH-ALGO': headers['paypal-auth-algo'] || '',
            'PAYPAL-CERT-URL': headers['paypal-cert-url'] || '',
            'PAYPAL-TRANSMISSION-ID': headers['paypal-transmission-id'] || '',
            'PAYPAL-TRANSMISSION-SIG': headers['paypal-transmission-sig'] || '',
            'PAYPAL-TRANSMISSION-TIME': headers['paypal-transmission-time'] || '',
          },
        }

        const verifyResponse = await fetch(`${getBaseUrl()}/v1/notifications/verify-webhook-signature`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`,
          },
          body: JSON.stringify(verificationBody),
        })

        if (verifyResponse.ok) {
          const verifyResult = await verifyResponse.json()
          if (verifyResult.verification_status !== 'SUCCESS') {
            console.warn('[PayPal] Webhook verification failed:', verifyResult.verification_status)
          }
        } else {
          console.warn('[PayPal] Webhook verification request failed:', await verifyResponse.text())
        }
      } catch (err) {
        console.warn('[PayPal] Webhook verification error:', err)
      }
    } else {
      console.warn('[PayPal] Webhook signature verification skipped - no webhook ID configured.')
    }

    return JSON.parse(body) as PayPalWebhookEvent
  }
}
