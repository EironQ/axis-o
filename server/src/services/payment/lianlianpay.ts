import { env } from '../../config/env'
import { getCachedSetting } from '../settingsCache'

function getLianlianpayDomain(): string {
  const mode = getCachedSetting('lianlianpay_mode') || 'live'
  if (mode === 'live' || mode === 'production') {
    return 'https://gpapi.lianlianpay.com'
  }
  return 'https://celer-api.lianlianpay-inc.com'
}

import { getSetting } from '../settingsCache'

async function resolveMerchantId(): Promise<string> {
  let cached = getCachedSetting('lianlianpay_merchant_id')
  if (cached) return cached
  
  const fromDb = await getSetting('lianlianpay_merchant_id')
  if (fromDb) return fromDb
  
  throw new Error('Lianlianpay Merchant ID is not configured')
}

async function resolvePrivateKey(): Promise<string> {
  let cached = getCachedSetting('lianlianpay_private_key')
  if (cached) return cached
  
  const fromDb = await getSetting('lianlianpay_private_key')
  if (fromDb) return fromDb
  
  throw new Error('Lianlianpay Private Key is not configured')
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
    const subMerchantId = await getCachedSetting('lianlianpay_sub_merchant_id')
    const privateKey = await resolvePrivateKey()

    const domain = getLianlianpayDomain()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const ms = String(now.getMilliseconds()).padStart(3, '0')
    const orderTime = `${year}${month}${day}${hours}${minutes}${seconds}`
    const currency = params.currency.toUpperCase()
    
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`
    
    console.log('Timestamp:', timestamp, 'length:', timestamp.length)
    console.log('OrderTime:', orderTime, 'length:', orderTime.length)
    const amountValue = params.amount.toFixed(2)
    const returnUrl = params.returnUrl || `${env.FRONTEND_URL}/checkout?orderId=${params.orderId}`
    const notifyUrl = params.notifyUrl || `${env.API_BASE_URL}/api/payments/lianlianpay/notify`

    const merchantTransactionId = `AXIS_${params.orderNumber}_${Date.now()}`

    try {
      const requestBody: Record<string, any> = {
        merchant_transaction_id: merchantTransactionId,
        merchant_id: merchantId,
        notification_url: notifyUrl,
        redirect_url: returnUrl,
        cancel_url: returnUrl,
        country: 'US',
        merchant_order: {
          merchant_order_id: params.orderNumber,
          merchant_order_time: orderTime,
          order_description: params.description || `AXIS O Order #${params.orderNumber}`,
          order_amount: Number(amountValue),
          order_currency_code: currency,
          products: [
            {
              product_id: `prod_${params.orderNumber}`,
              name: 'AXIS O Product',
              description: params.description || 'Order payment',
              url: 'https://axis-o.com',
              sku: 'AXIS-O-SKU-001',
              shipping_provider: 'DHL',
              price: Number(amountValue),
              quantity: 1,
              category: '36321643',
            },
          ],
        },
        customer: {
          customer_type: 'I',
          first_name: 'Guest',
          last_name: 'User',
          full_name: 'Guest User',
          email: 'guest@example.com',
          phone: '+8613800138000',
          ip: '127.0.0.1',
        },
        billing: {
          billing_name: 'Guest User',
          billing_phone: '+8613800138000',
          billing_email: 'guest@example.com',
          billing_address: {
            street_address1: '123 Main St',
            street_address2: '',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
        },
        shipping: {
          shipping_name: 'Guest User',
          shipping_phone: '+8613800138000',
          shipping_email: 'guest@example.com',
          shipping_address: {
            street_address1: '123 Main St',
            street_address2: '',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'US',
          },
        },
      }

      if (subMerchantId) {
        requestBody.sub_merchant_id = subMerchantId
      }

      // 连连支付签名格式：按字母升序排列，递归展平为 key=value&key=value 格式
      const signStr = this.buildSignString(requestBody)
      const signature = await this.signRequest(signStr, privateKey)

      // 发送请求体用原始JSON（排序后）
      const sortedBody = this.sortObject(requestBody)
      const requestBodyStr = JSON.stringify(sortedBody)

      console.log('Lianlianpay request:', { url: `${domain}/v3/merchants/${merchantId}/payments`, timestamp })
      
      const response = await fetch(`${domain}/v3/merchants/${merchantId}/payments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'signature': signature,
          'timezone': 'Asia/Shanghai',
          'timestamp': timestamp,
        },
        body: requestBodyStr,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Lianlianpay API error: ${response.status} - ${errorText}`)
      }

      const result = await response.json() as any

      if (result.return_code !== 'SUCCESS') {
        throw new Error(`Lianlianpay payment failed: ${result.return_message || result.return_code || JSON.stringify(result)}`)
      }

      return {
        paymentId: result.order?.ll_transaction_id || merchantTransactionId,
        redirectUrl: result.order?.payment_url || '',
        totalAmount: amountValue,
      }
    } catch (error: any) {
      console.error('Lianlianpay payment error:', error)
      throw error
    }
  }

  static sortObject(obj: any): any {
    if (obj === null || typeof obj !== 'object') {
      return obj
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sortObject(item))
    }
    
    const sortedKeys = Object.keys(obj).sort()
    const sortedObj: any = {}
    for (const key of sortedKeys) {
      sortedObj[key] = this.sortObject(obj[key])
    }
    return sortedObj
  }

  /**
   * 构建连连支付签名串：递归排序后展平为 key=value&key=value 格式
   * 例如: {"a":"100","b":{"c":"10","d":"20"}} → a=100&c=10&d=20
   */
  static buildSignString(obj: any): string {
    if (obj === null || obj === undefined) {
      return ''
    }
    
    if (typeof obj !== 'object') {
      return String(obj)
    }
    
    if (Array.isArray(obj)) {
      // 数组元素递归处理，用&连接
      return obj.map(item => this.buildSignString(item)).filter(s => s !== '').join('&')
    }
    
    // 对象按key字母升序排列，递归展平
    const sortedKeys = Object.keys(obj).sort()
    const parts: string[] = []
    for (const key of sortedKeys) {
      const value = obj[key]
      if (value === null || value === undefined) {
        continue // null/undefined不参与签名
      }
      if (typeof value === 'object') {
        // 子对象/数组递归展平
        const subStr = this.buildSignString(value)
        if (subStr !== '') {
          parts.push(subStr)
        }
      } else {
        // 基本类型：key=value
        parts.push(`${key}=${String(value)}`)
      }
    }
    return parts.join('&')
  }

  static async signRequest(data: string, privateKey: string): Promise<string> {
    try {
      const crypto = await import('crypto')
      
      let formattedKey = privateKey.trim()
      
      // 处理PKCS8格式私钥
      if (formattedKey.startsWith('-----BEGIN PRIVATE KEY-----')) {
        formattedKey = formattedKey.replace(
          /-----BEGIN PRIVATE KEY-----\s*/,
          '-----BEGIN PRIVATE KEY-----\n'
        )
        formattedKey = formattedKey.replace(
          /\s*-----END PRIVATE KEY-----/,
          '\n-----END PRIVATE KEY-----'
        )
      } else if (formattedKey.startsWith('-----BEGIN RSA PRIVATE KEY-----')) {
        formattedKey = formattedKey.replace(
          /-----BEGIN RSA PRIVATE KEY-----\s*/,
          '-----BEGIN RSA PRIVATE KEY-----\n'
        )
        formattedKey = formattedKey.replace(
          /\s*-----END RSA PRIVATE KEY-----/,
          '\n-----END RSA PRIVATE KEY-----'
        )
      } else {
        if (formattedKey.includes('\\n')) {
          formattedKey = formattedKey.replace(/\\n/g, '\n')
        }
        formattedKey = '-----BEGIN PRIVATE KEY-----\n' + formattedKey + '\n-----END PRIVATE KEY-----'
      }
      
      // 连连支付使用SHA1withRSA
      const sign = crypto.createSign('RSA-SHA1')
      sign.update(Buffer.from(data, 'utf8'))
      const signature = sign.sign(formattedKey, 'base64')
      return signature
    } catch (error: any) {
      console.error('Lianlianpay sign error:', error.message || error)
      console.error('Error stack:', error.stack)
      throw new Error('Failed to sign request: ' + (error.message || 'Unknown error'))
    }
  }

  static async queryPayment(orderId: string): Promise<{ status: string; transactionId: string }> {
    const merchantId = await resolveMerchantId()
    const privateKey = await resolvePrivateKey()

    const domain = getLianlianpayDomain()
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const day = String(now.getDate()).padStart(2, '0')
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    const timestamp = `${year}${month}${day}${hours}${minutes}${seconds}`

    const requestBody = {
      merchant_id: merchantId,
      merchant_transaction_id: orderId,
    }

    // 使用key=value&key=value格式签名
    const signStr = this.buildSignString(requestBody)
    const signature = await this.signRequest(signStr, privateKey)

    console.log('Query URL:', `${domain}/v3/merchants/${merchantId}/payments/${orderId}`)
    console.log('Query sign string:', signStr)

    const response = await fetch(`${domain}/v3/merchants/${merchantId}/payments/${orderId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'signature': signature,
        'timezone': 'Asia/Shanghai',
        'timestamp': timestamp,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Lianlianpay query error: ${response.status} - ${errorText}`)
    }

    const result = await response.json() as any

    if (result.return_code !== 'SUCCESS') {
      throw new Error(`Lianlianpay query failed: ${result.return_message || result.return_code}`)
    }

    return {
      status: result.order?.payment_data?.payment_status || 'UNKNOWN',
      transactionId: result.order?.ll_transaction_id || orderId,
    }
  }
}