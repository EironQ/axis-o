import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'

function getLianlianpayDomain(): string {
  // 连连支付沙箱域名已下线，统一使用生产域名
  // 测试环境通过测试商户号区分，不依赖独立域名
  return 'https://api.lianlianpay.com'
}

async function resolveMerchantId(): Promise<string> {
  const cached = getCachedSetting('lianlianpay_merchant_id')
  if (cached) return cached
  const fresh = await getSetting('lianlianpay_merchant_id')
  if (fresh) return fresh
  return process.env.LIANLIANPAY_MERCHANT_ID || ''
}

async function resolvePrivateKey(): Promise<string> {
  const cached = getCachedSetting('lianlianpay_private_key')
  if (cached) return cached
  const fresh = await getSetting('lianlianpay_private_key')
  if (fresh) return fresh
  return process.env.LIANLIANPAY_PRIVATE_KEY || ''
}

async function resolvePublicKey(): Promise<string> {
  const cached = getCachedSetting('lianlianpay_public_key')
  if (cached) return cached
  const fresh = await getSetting('lianlianpay_public_key')
  if (fresh) return fresh
  return process.env.LIANLIANPAY_PUBLIC_KEY || ''
}

export interface CreateLianlianpayPaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  description?: string
  returnUrl?: string
  notifyUrl?: string
}

export interface LianlianpayPaymentResult {
  paymentId: string
  redirectUrl: string
  totalAmount: string
}

export class LianlianpayService {
  static async createPayment(params: CreateLianlianpayPaymentParams): Promise<LianlianpayPaymentResult> {
    const merchantId = await resolveMerchantId()
    const privateKey = await resolvePrivateKey()

    if (!merchantId) {
      throw new Error('Lianlianpay Merchant ID is not configured. Please set it in Admin Settings > Payment.')
    }
    if (!privateKey) {
      throw new Error('Lianlianpay Private Key is not configured. Please set it in Admin Settings > Payment.')
    }

    const domain = getLianlianpayDomain()
    const currency = params.currency.toUpperCase()
    const amountValue = params.amount.toFixed(2)
    const returnUrl = params.returnUrl || `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`
    const notifyUrl = params.notifyUrl || `${env.API_BASE_URL}/api/payments/lianlianpay/notify`

    const noOrderNo = `AXIS_${params.orderNumber}`

    try {
      const businessInfo = JSON.stringify({
        requestTimestamp: new Date().toISOString(),
        partnerId: merchantId,
        noOrder: noOrderNo,
        orderInfo: params.description || `AXIS O - Order #${params.orderNumber}`,
        amount: amountValue,
        currencyCode: currency,
        returnUrl,
        notifyUrl,
      })

      const response = await fetch(`${domain}/api/v1/acct/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          partner_id: merchantId,
          business_info: businessInfo,
          sign_type: 'RSA',
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Lianlianpay API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as any

      if (result.ret_code !== '0000') {
        throw new Error(`Lianlianpay payment failed: ${result.ret_msg || result.ret_code}`)
      }

      return {
        paymentId: result.data?.oid_partner || result.data?.no_order || noOrderNo,
        redirectUrl: result.data?.pay_url || result.data?.redirect_url || '',
        totalAmount: amountValue,
      }
    } catch (error: any) {
      console.error('Lianlianpay payment error:', error)
      throw error
    }
  }

  static async queryPayment(orderId: string): Promise<{ status: string; transactionId: string }> {
    const merchantId = await resolveMerchantId()
    const privateKey = await resolvePrivateKey()

    if (!merchantId || !privateKey) {
      throw new Error('Lianlianpay credentials not configured')
    }

    const domain = getLianlianpayDomain()

    const businessInfo = JSON.stringify({
      requestTimestamp: new Date().toISOString(),
      partnerId: merchantId,
      noOrder: `AXIS_${orderId}`,
    })

    const response = await fetch(`${domain}/api/v1/acct/payment/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        partner_id: merchantId,
        business_info: businessInfo,
        sign_type: 'RSA',
      }),
    })

    if (!response.ok) {
      throw new Error(`Lianlianpay query API error: ${response.status}`)
    }

    const result = await response.json() as any

    if (result.ret_code !== '0000') {
      return { status: 'unknown', transactionId: '' }
    }

    const payStatus = result.data?.pay_status || ''
    let status = 'pending'
    if (payStatus === 'SUCCESS') status = 'succeeded'
    else if (payStatus === 'FAIL') status = 'failed'
    else if (payStatus === 'PROCESSING') status = 'processing'

    return {
      status,
      transactionId: result.data?.oid_partner || '',
    }
  }
}
