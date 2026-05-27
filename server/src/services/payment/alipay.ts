import * as crypto from 'crypto'
import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'

const ANTOM_PAY_PATH = '/ams/api/v1/payments/pay'
const ANTOM_INQUIRY_PATH = '/ams/api/v1/payments/inquiryPayment'
const ANTOM_REFUND_PATH = '/ams/api/v1/payments/refund'

function getAntomDomain(): string {
  const mode = getCachedSetting('antom_mode') || env.ALIPAY_MODE || 'sandbox'
  if (mode === 'production' || mode === 'live') {
    return 'https://open-na-global.alipay.com'
  }
  return 'https://open-na-global.alipay.com'
}

function getPayPath(): string {
  const mode = getCachedSetting('antom_mode') || env.ALIPAY_MODE || 'sandbox'
  if (mode === 'production' || mode === 'live') {
    return ANTOM_PAY_PATH
  }
  return '/ams/sandbox/api/v1/payments/pay'
}

function getInquiryPath(): string {
  const mode = getCachedSetting('antom_mode') || env.ALIPAY_MODE || 'sandbox'
  if (mode === 'production' || mode === 'live') {
    return ANTOM_INQUIRY_PATH
  }
  return '/ams/sandbox/api/v1/payments/inquiryPayment'
}

function getRefundPath(): string {
  const mode = getCachedSetting('antom_mode') || env.ALIPAY_MODE || 'sandbox'
  if (mode === 'production' || mode === 'live') {
    return ANTOM_REFUND_PATH
  }
  return '/ams/sandbox/api/v1/payments/refund'
}

async function resolveClientId(): Promise<string> {
  const cached = getCachedSetting('antom_client_id')
  if (cached) return cached
  const fresh = await getSetting('antom_client_id')
  if (fresh) return fresh
  return process.env.ANTOM_CLIENT_ID || env.ALIPAY_APP_ID
}

async function resolvePrivateKey(): Promise<string> {
  const cached = getCachedSetting('antom_private_key')
  if (cached) return cached
  const fresh = await getSetting('antom_private_key')
  if (fresh) return fresh
  return process.env.ANTOM_PRIVATE_KEY || env.ALIPAY_PRIVATE_KEY
}

async function resolveAntomPublicKey(): Promise<string> {
  const cached = getCachedSetting('antom_public_key')
  if (cached) return cached
  const fresh = await getSetting('antom_public_key')
  if (fresh) return fresh
  return process.env.ANTOM_PUBLIC_KEY || env.ALIPAY_PUBLIC_KEY
}

function rsa256Sign(content: string, privateKey: string): string {
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(content, 'utf8')
  const sig = sign.sign(privateKey, 'base64')
  return encodeURIComponent(sig)
}

function rsa256Verify(content: string, signature: string, publicKey: string): boolean {
  const decodedSig = decodeURIComponent(signature)
  const verify = crypto.createVerify('RSA-SHA256')
  verify.update(content, 'utf8')
  return verify.verify(publicKey, decodedSig, 'base64')
}

function toSmallestUnit(amount: number, currency: string): string {
  const zeroDecimalCurrencies = new Set(['JPY', 'KRW', 'VND', 'IDR'])
  if (zeroDecimalCurrencies.has(currency.toUpperCase())) {
    return Math.round(amount).toString()
  }
  return Math.round(amount * 100).toString()
}

function generatePaymentRequestId(orderId: string): string {
  return `PAY_${orderId}_${Date.now()}`
}

export interface CreateAntomPaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface AntomPaymentResult {
  paymentId: string
  paymentRequestId: string
  redirectUrl: string
  totalAmount: string
}

export class AlipayService {
  static async createPayment(params: CreateAntomPaymentParams): Promise<AntomPaymentResult> {
    const clientId = await resolveClientId()
    const privateKey = await resolvePrivateKey()

    if (!clientId) {
      throw new Error('Antom Client ID is not configured. Please set it in Admin Settings > Payment.')
    }
    if (!privateKey) {
      throw new Error('Antom Private Key is not configured. Please set it in Admin Settings > Payment.')
    }

    const currency = params.currency.toUpperCase()
    const amountValue = toSmallestUnit(params.amount, currency)
    const paymentRequestId = generatePaymentRequestId(params.orderId)
    const returnUrl = params.returnUrl || `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`
    const notifyUrl = params.notifyUrl || `${env.API_BASE_URL}/api/payments/alipay/notify`

    const requestBody = JSON.stringify({
      productCode: 'CASHIER_PAYMENT',
      paymentRequestId,
      paymentAmount: {
        currency,
        value: amountValue,
      },
      paymentMethod: {
        paymentMethodType: 'ALIPAY_CN',
      },
      paymentRedirectUrl: returnUrl,
      paymentNotifyUrl: notifyUrl,
      order: {
        referenceOrderId: params.orderId,
        orderDescription: params.description || `AXIS O - Order #${params.orderNumber}`,
        orderAmount: {
          currency,
          value: amountValue,
        },
      },
      env: {
        terminalType: 'WEB',
      },
      settlementStrategy: {
        settlementCurrency: currency,
      },
    })

    const requestTime = Date.now().toString()
    const path = getPayPath()
    const contentToSign = `POST ${path}\n${clientId}.${requestTime}.${requestBody}`
    const signature = rsa256Sign(contentToSign, privateKey)

    const url = `${getAntomDomain()}${path}`
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'client-id': clientId,
        'request-time': requestTime,
        'Signature': `algorithm=RSA256,keyVersion=1,signature=${signature}`,
      },
      body: requestBody,
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Antom create payment failed: ${response.status} ${errorText}`)
    }

    const data = await response.json() as {
      result: { resultCode: string; resultMessage: string; resultStatus: string }
      paymentId?: string
      normalUrl?: string
      orderCodeForm?: { qrCode?: { qrCodeFormat?: string; qrCodeValue?: string }; codeDetails?: Array<{ codeType?: string; codeValue?: string; displayType?: string }> }
    }

    if (data.result.resultStatus === 'F') {
      throw new Error(`Antom payment creation failed: ${data.result.resultCode} - ${data.result.resultMessage}`)
    }

    const redirectUrl = data.normalUrl || data.orderCodeForm?.qrCode?.qrCodeValue || ''

    if (!redirectUrl) {
      throw new Error('Antom did not return a payment URL')
    }

    return {
      paymentId: data.paymentId || paymentRequestId,
      paymentRequestId,
      redirectUrl,
      totalAmount: amountValue,
    }
  }

  static async inquiryPayment(paymentId: string): Promise<{ paymentStatus: string; resultCode: string }> {
    const clientId = await resolveClientId()
    const privateKey = await resolvePrivateKey()

    if (!clientId || !privateKey) {
      throw new Error('Antom credentials not configured')
    }

    const requestBody = JSON.stringify({ paymentId })
    const requestTime = Date.now().toString()
    const path = getInquiryPath()
    const contentToSign = `POST ${path}\n${clientId}.${requestTime}.${requestBody}`
    const signature = rsa256Sign(contentToSign, privateKey)

    const response = await fetch(`${getAntomDomain()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'client-id': clientId,
        'request-time': requestTime,
        'Signature': `algorithm=RSA256,keyVersion=1,signature=${signature}`,
      },
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`Antom inquiry failed: ${response.status}`)
    }

    const data = await response.json() as {
      result: { resultCode: string; resultMessage: string; resultStatus: string }
      paymentStatus?: string
      paymentId?: string
    }

    return {
      paymentStatus: data.paymentStatus || '',
      resultCode: data.result.resultCode,
    }
  }

  static async createRefund(paymentId: string, refundAmount: number, currency: string): Promise<{ refundId: string; resultCode: string }> {
    const clientId = await resolveClientId()
    const privateKey = await resolvePrivateKey()

    if (!clientId || !privateKey) {
      throw new Error('Antom credentials not configured')
    }

    const amountValue = toSmallestUnit(refundAmount, currency)
    const refundRequestId = `REF_${paymentId}_${Date.now()}`

    const requestBody = JSON.stringify({
      refundRequestId,
      paymentId,
      refundAmount: {
        currency: currency.toUpperCase(),
        value: amountValue,
      },
      refundReason: 'Merchant initiated refund',
    })

    const requestTime = Date.now().toString()
    const path = getRefundPath()
    const contentToSign = `POST ${path}\n${clientId}.${requestTime}.${requestBody}`
    const signature = rsa256Sign(contentToSign, privateKey)

    const response = await fetch(`${getAntomDomain()}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=UTF-8',
        'client-id': clientId,
        'request-time': requestTime,
        'Signature': `algorithm=RSA256,keyVersion=1,signature=${signature}`,
      },
      body: requestBody,
    })

    if (!response.ok) {
      throw new Error(`Antom refund failed: ${response.status}`)
    }

    const data = await response.json() as {
      result: { resultCode: string; resultMessage: string; resultStatus: string }
      refundId?: string
      refundRequestId?: string
    }

    if (data.result.resultStatus === 'F') {
      throw new Error(`Antom refund failed: ${data.result.resultCode} - ${data.result.resultMessage}`)
    }

    return {
      refundId: data.refundId || '',
      resultCode: data.result.resultCode,
    }
  }

  static verifyNotification(headers: Record<string, string>, body: string): boolean {
    const antomPublicKey = getCachedSetting('antom_public_key') || process.env.ANTOM_PUBLIC_KEY || env.ALIPAY_PUBLIC_KEY
    if (!antomPublicKey) {
      console.warn('[Antom] Notification verification skipped - no public key configured')
      return true
    }

    const requestUri = headers['x-request-uri'] || ''
    const requestMethod = headers['x-request-method'] || 'POST'
    const clientId = headers['client-id'] || ''
    const requestTime = headers['request-time'] || ''
    const signature = headers['signature'] || ''

    if (!signature) {
      console.error('[Antom] Notification missing signature header')
      return false
    }

    const sigMatch = signature.match(/signature=([^,]+)/)
    const sigValue = sigMatch ? sigMatch[1] : signature

    const contentToVerify = `${requestMethod} ${requestUri}\n${clientId}.${requestTime}.${body}`

    return rsa256Verify(contentToVerify, sigValue, antomPublicKey)
  }

  static async getAntomClientId(): Promise<string> {
    const published = getCachedSetting('antom_client_id')
    if (published) return published
    const fresh = await getSetting('antom_client_id')
    if (fresh) return fresh
    return process.env.ANTOM_CLIENT_ID || env.ALIPAY_APP_ID
  }
}
