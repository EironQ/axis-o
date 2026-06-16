import { env } from '../../config/env'
import { getCachedSetting, getSetting } from '../settingsCache'
import * as crypto from 'crypto'

// ============================================
// 连连国际版 (LianLian Global / Inc) API
// 文档: https://doc.lianlianpay.com/3476473e0
// ============================================

// 生产环境域名
const PRODUCTION_DOMAIN = 'https://gpapi.lianlianpay.com'
// 沙箱环境域名
const SANDBOX_DOMAIN = 'https://celer-api.LianLianpay-inc.com'

function getDomain(): string {
  // 沙箱模式使用沙箱域名，生产环境使用生产域名
  const mode = process.env.LIANLIANPAY_MODE || 'production'
  return mode === 'sandbox' ? SANDBOX_DOMAIN : PRODUCTION_DOMAIN
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
  if (cached) return normalizePrivateKey(cached)
  const fresh = await getSetting('lianlianpay_private_key')
  if (fresh) return normalizePrivateKey(fresh)
  return process.env.LIANLIANPAY_PRIVATE_KEY || ''
}

/**
 * 规范化私钥格式：
 * - 如果是纯 Base64（无 PEM 头尾），自动包装为 PKCS#8 PEM 格式
 * - 如果已有 PEM 头尾，直接返回
 */
function normalizePrivateKey(key: string): string {
  if (!key) return key
  const trimmed = key.trim()
  // 已经是标准 PEM 格式（头尾独占一行）
  if (/^-----BEGIN[\s\S]+?-----END/.test(trimmed) && trimmed.includes('\n')) {
    console.log('[LIANLIAN] Key already standard PEM format, length:', trimmed.length)
    return trimmed
  }

  // 提取纯 Base64 内容（去掉所有 PEM 头尾标记）
  const base64Content = trimmed
    .replace(/-----BEGIN[\s\S]*?KEY-----/g, '')  // 去掉头部
    .replace(/-----END[\s\S]*?KEY-----/g, '')    // 去掉尾部
    .trim()
    .replace(/\s+/g, '')                          // 去掉所有空白

  if (!base64Content) {
    console.log('[LIANLIAN] No base64 content found in key')
    return key
  }

  console.log('[LIANLIAN] Rebuilding PEM from base64, content length:', base64Content.length)
  // 每 64 字符换行，包装为标准 PKCS#8 PEM
  const lines = base64Content.match(/.{1,64}/g) || [base64Content]
  const pem = '-----BEGIN PRIVATE KEY-----\n' + lines.join('\n') + '\n-----END PRIVATE KEY-----'
  console.log('[LIANLIAN] Rebuilt PEM first 80 chars:', pem.substring(0, 80))
  return pem
}

/**
 * 生成签名
 * 签名因子: merchant_id + merchant_transaction_id
 * 使用 RSA-SHA256 私钥签名，Base64 编码输出
 */
function generateSignature(merchantId: string, merchantTransactionId: string, privateKey: string): string {
  // 构造签名字符串: merchant_id=xxx&merchant_transaction_id=xxx
  const signStr = `merchant_id=${merchantId}&merchant_transaction_id=${merchantTransactionId}`

  // RSA-SHA256 签名
  const sign = crypto.createSign('RSA-SHA256')
  sign.update(signStr)
  sign.end()

  const signature = sign.sign(privateKey, 'base64')
  return signature
}

export interface CreateLianlianpayPaymentParams {
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  description?: string
  returnUrl?: string
  notifyUrl?: string
  customerInfo?: {
    email?: string
    phone?: string
    firstName?: string
    lastName?: string
    country?: string
  }
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

    const domain = getDomain()
    const currency = params.currency.toUpperCase()
    // 连连国际版 API 金额单位为最小货币单位（分/cents）
    const amountInCents = Math.round(params.amount * 100)
    const returnUrl = params.returnUrl || `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`
    const notifyUrl = params.notifyUrl || `${env.API_BASE_URL}/api/payments/lianlianpay/notify`

    // 商户端交易号
    const merchantTransactionId = `AXIS_${params.orderNumber}`

    try {
      // 构造请求体（符合连连国际版 v3 API 格式）
      const now = new Date()
      const orderTime = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

      const requestBody: Record<string, any> = {
        merchant_transaction_id: merchantTransactionId,
        merchant_id: merchantId,
        notification_url: notifyUrl,
        redirect_url: returnUrl,
        country: this.getCountryCode(currency),
        merchant_order: {
          merchant_order_id: params.orderNumber,
          merchant_user_no: `USER_${params.orderNumber}`,
          merchant_order_time: orderTime,
          order_description: params.description || `AXIS O - Order #${params.orderNumber}`,
          order_amount: amountInCents,
          order_currency_code: currency,
        },
      }

      // 可选：添加客户信息
      if (params.customerInfo?.email || params.customerInfo?.phone) {
        requestBody.customer = {}
        if (params.customerInfo.email) requestBody.customer.email = params.customerInfo.email
        if (params.customerInfo.phone) requestBody.customer.phone = params.customerInfo.phone
        if (params.customerInfo.firstName) requestBody.customer.first_name = params.customerInfo.firstName
        if (params.customerInfo.lastName) requestBody.customer.last_name = params.customerInfo.lastName
        if (params.customerInfo.country) requestBody.customer.country = params.customerInfo.country
      }

      // 生成签名
      const signature = generateSignature(merchantId, merchantTransactionId, privateKey)

      // 格式化时间戳: yyyyMMddHHmmss
      const timestamp = orderTime

      console.log('[LIANLIAN] === REQUEST DEBUG ===')
      console.log('[LIANLIAN] URL:', `${domain}/v3/merchants/${merchantId}/payments`)
      console.log('[LIANLIAN] BODY:', JSON.stringify(requestBody, null, 2))
      console.log('[LIANLIAN] Headers: signature=' + signature.substring(0, 30) + '... timezone=Asia/Shanghai timestamp=' + timestamp)

      const response = await fetch(`${domain}/v3/merchants/${merchantId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'signature': signature,
          'timezone': 'Asia/Shanghai',
          'timestamp': timestamp,
        },
        body: JSON.stringify(requestBody),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('LianLian Global API error:', response.status, errorText)
        throw new Error(`LianLian Global API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as any

      // 检查返回状态（国际版返回格式可能与国内版不同）
      if (result.code && result.code !== '0000' && result.code !== 'SUCCESS' && result.code !== 200) {
        throw new Error(`LianLian Global payment failed: ${result.message || result.msg || JSON.stringify(result)}`)
      }

      return {
        paymentId: result.data?.transaction_id || result.transaction_id || merchantTransactionId,
        redirectUrl: result.data?.payment_url || result.payment_url || result.data?.redirect_url || '',
        totalAmount: amountInCents.toString(),
      }
    } catch (error: any) {
      console.error('LianLian Global payment error:', error)
      throw error
    }
  }

  static async queryPayment(orderId: string): Promise<{ status: string; transactionId: string }> {
    const merchantId = await resolveMerchantId()
    const privateKey = await resolvePrivateKey()

    if (!merchantId || !privateKey) {
      throw new Error('Lianlianpay credentials not configured')
    }

    const domain = getDomain()
    const merchantTransactionId = `AXIS_${orderId}`

    const signature = generateSignature(merchantId, merchantTransactionId, privateKey)
    const now = new Date()
    const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`

    const response = await fetch(
      `${domain}/v3/merchants/${merchantId}/payments/${merchantTransactionId}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'signature': signature,
          'timezone': 'Asia/Shanghai',
          'timestamp': timestamp,
        },
      }
    )

    if (!response.ok) {
      console.error('LianLian Global query error:', response.status)
      throw new Error(`LianLian Global query API error: ${response.status}`)
    }

    const result = await response.json() as any

    // 国际版支付状态映射
    const payStatus = result.data?.status || result.status || ''
    let status = 'pending'
    if (payStatus === 'SUCCESS' || payStatus === 'SUCCEEDED' || payStatus === 'settled') status = 'succeeded'
    else if (payStatus === 'FAILED' || payStatus === 'FAIL' || payStatus === 'cancelled') status = 'failed'
    else if (payStatus === 'PROCESSING' || payStatus === 'pending') status = 'processing'

    return {
      status,
      transactionId: result.data?.transaction_id || result.transaction_id || '',
    }
  }

  /**
   * 根据货币代码推断国家代码
   */
  private static getCountryCode(currency: string): string {
    const map: Record<string, string> = {
      'USD': 'US',
      'EUR': 'DE',
      'GBP': 'GB',
      'JPY': 'JP',
      'HKD': 'HK',
      'SGD': 'SG',
      'AUD': 'AU',
      'CAD': 'CA',
      'NZD': 'NZ',
      'CNY': 'CN',
      'KRW': 'KR',
      'MYR': 'MY',
      'THB': 'TH',
      'PHP': 'PH',
      'IDR': 'ID',
      'VND': 'VN',
      'INR': 'IN',
      'BRL': 'BR',
      'MXN': 'MX',
      'ZAR': 'ZA',
      'NGN': 'NG',
      'EGP': 'EG',
      'AED': 'AE',
      'SAR': 'SA',
    }
    return map[currency] || 'US'
  }
}
