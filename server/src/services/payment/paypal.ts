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

function isPlaceholderCredential(value: string): boolean {
  return !value || value.startsWith('your-') || value === 'placeholder' || value === 'test'
}

async function resolveClientId(): Promise<string> {
  const cached = getCachedSetting('paypal_client_id')?.trim()
  if (cached && !isPlaceholderCredential(cached)) {
    return cached
  }
  const fresh = (await getSetting('paypal_client_id'))?.trim()
  if (fresh && !isPlaceholderCredential(fresh)) {
    return fresh
  }
  const envVal = env.PAYPAL_CLIENT_ID?.trim()
  if (envVal && !isPlaceholderCredential(envVal)) {
    return envVal
  }
  return ''
}

async function resolveClientSecret(): Promise<string> {
  const cached = getCachedSetting('paypal_client_secret')?.trim()
  if (cached && !isPlaceholderCredential(cached)) {
    return cached
  }
  const fresh = (await getSetting('paypal_client_secret'))?.trim()
  if (fresh && !isPlaceholderCredential(fresh)) {
    return fresh
  }
  const envVal = env.PAYPAL_CLIENT_SECRET?.trim()
  if (envVal && !isPlaceholderCredential(envVal)) {
    return envVal
  }
  return ''
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetch(url, { ...init, signal: controller.signal })
    return response
  } finally {
    clearTimeout(timer)
  }
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
  const published = getCachedSetting('paypal_client_id')
  if (published && !isPlaceholderCredential(published)) return published
  const fresh = await getSetting('paypal_client_id')
  if (fresh && !isPlaceholderCredential(fresh)) return fresh
  return env.PAYPAL_CLIENT_ID
}

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (accessTokenCache && accessTokenCache.expiresAt > now) {
    return accessTokenCache.token
  }

  const clientId = (await resolveClientId()).trim()
  const clientSecret = (await resolveClientSecret()).trim()
  const mode = isSandbox() ? 'sandbox' : 'live'

  if (!clientId || !clientSecret) {
    throw new Error('PayPal 支付凭证未配置，请在后台管理 > 支付设置中配置有效的 PayPal Client ID 和 Secret')
  }

  console.log(`[PayPal] Getting access token for mode: ${mode}, clientId: ${clientId.substring(0, 8)}...`)

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

  let oauthResponse: Response
  try {
    oauthResponse = await fetchWithTimeout(`${getBaseUrl()}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    })
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('PayPal 服务连接超时，请稍后重试')
    }
    throw new Error('无法连接到 PayPal 服务，请检查网络连接')
  }

  if (!oauthResponse.ok) {
    let errorData: any = {}
    try {
      errorData = await oauthResponse.json()
    } catch {
      errorData = {}
    }
    const errorMessage = errorData.error_description || errorData.error || 'Unknown authentication error'
    console.error(`[PayPal] Authentication failed: ${oauthResponse.status} - ${errorMessage}`)
    console.error(`[PayPal] Mode: ${mode}, Client ID prefix: ${clientId.substring(0, 8)}...`)
    if (oauthResponse.status === 401) {
      throw new Error(`PayPal 认证失败: Client ID 或 Secret 不正确，或凭证与模式不匹配（当前模式: ${mode}）`)
    }
    throw new Error(`PayPal 认证失败: ${errorMessage}`)
  }

  const data = (await oauthResponse.json()) as PayPalAccessToken
  accessTokenCache = {
    token: data.access_token,
    expiresAt: now + (data.expires_in - 60) * 1000,
  }

  console.log(`[PayPal] Access token obtained successfully, expires in ${data.expires_in}s`)

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

const SUPPORTED_CURRENCIES = ['USD', 'CNY', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD']

function convertCurrency(amount: number, currency: string): { amount: string; currency: string } {
  const normalizedCurrency = currency.toUpperCase()
  const validCurrency = SUPPORTED_CURRENCIES.includes(normalizedCurrency) ? normalizedCurrency : 'USD'
  return { amount: amount.toFixed(2), currency: validCurrency }
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

    let createResponse: Response
    try {
      createResponse = await fetchWithTimeout(`${getBaseUrl()}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'PayPal-Request-Id': `${params.orderId}-${Date.now()}`,
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('PayPal 创建订单超时，请稍后重试')
      }
      throw new Error('无法连接到 PayPal 服务，请检查网络连接')
    }

    if (!createResponse.ok) {
      const errorData = await createResponse.json().catch(() => ({ details: [] }))
      const errorMessage = errorData.details?.[0]?.description || errorData.message || 'Unknown error'
      console.error(`[PayPal] createOrder failed: ${createResponse.status} - ${errorMessage}`)
      throw new Error(`PayPal 创建订单失败: ${errorMessage}`)
    }

    const data = (await createResponse.json()) as PayPalOrderResponse

    return {
      paypalOrderId: data.id,
      status: data.status,
    }
  }

  static async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
    const accessToken = await getAccessToken()

    let captureResponse: Response
    try {
      captureResponse = await fetchWithTimeout(`${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('PayPal 支付捕获超时，请稍后重试')
      }
      throw new Error('无法连接到 PayPal 服务，请检查网络连接')
    }

    if (!captureResponse.ok) {
      const errorData = await captureResponse.json().catch(() => ({ details: [] }))
      const issue = errorData.details?.[0]?.issue || ''
      const errorMessage = errorData.details?.[0]?.description || errorData.message || 'Unknown error'
      console.error(`[PayPal] captureOrder failed: ${captureResponse.status} - ${issue} - ${errorMessage}`, JSON.stringify(errorData))
      const fullError = issue ? `${issue}: ${errorMessage}` : errorMessage
      throw new Error(`PayPal 支付捕获失败: ${fullError}`)
    }

    const data = (await captureResponse.json()) as PayPalCaptureResponse
    return data
  }

  static async getOrder(paypalOrderId: string): Promise<PayPalOrderResponse> {
    const accessToken = await getAccessToken()

    let getResponse: Response
    try {
      getResponse = await fetchWithTimeout(`${getBaseUrl()}/v2/checkout/orders/${paypalOrderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('PayPal 查询订单超时，请稍后重试')
      }
      throw new Error('无法连接到 PayPal 服务，请检查网络连接')
    }

    if (!getResponse.ok) {
      const errorData = await getResponse.json().catch(() => ({ details: [] }))
      const issue = errorData.details?.[0]?.issue || ''
      const errorMessage = errorData.details?.[0]?.description || errorData.message || 'Unknown error'
      console.error(`[PayPal] getOrder failed: ${getResponse.status} - ${issue} - ${errorMessage}`, JSON.stringify(errorData))
      const fullError = issue ? `${issue}: ${errorMessage}` : errorMessage
      throw new Error(`PayPal 查询订单失败: ${fullError}`)
    }

    const data = (await getResponse.json()) as PayPalOrderResponse
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

    let refundResponse: Response
    try {
      refundResponse = await fetchWithTimeout(`${getBaseUrl()}/v2/payments/captures/${captureId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new Error('PayPal 退款请求超时，请稍后重试')
      }
      throw new Error('无法连接到 PayPal 服务，请检查网络连接')
    }

    if (!refundResponse.ok) {
      const errorData = await refundResponse.json().catch(() => ({ details: [] }))
      const errorMessage = errorData.details?.[0]?.description || errorData.message || 'Unknown error'
      console.error(`[PayPal] refund failed: ${refundResponse.status} - ${errorMessage}`)
      throw new Error(`PayPal 退款失败: ${errorMessage}`)
    }

    const data = (await refundResponse.json()) as PayPalRefundResponse
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
