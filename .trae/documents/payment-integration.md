# AXIS O 支付对接详细方案

## 一、统一支付网关抽象层

```typescript
// server/src/services/payment/types.ts

interface PaymentIntent {
  orderId: string
  amount: number       // 单位：分（美元美分）
  currency: string     // ISO 4217
  description: string
  metadata: Record<string, string>
  customerEmail: string
  returnUrl: string    // 支付完成跳转地址
  cancelUrl: string    // 取消支付跳转地址
}

interface PaymentResult {
  success: boolean
  provider: 'stripe' | 'paypal' | 'alipay'
  transactionId: string
  status: 'succeeded' | 'processing' | 'failed'
  redirectUrl?: string       // 需要跳转的支付页面 URL
  clientSecret?: string      // Stripe 前端用
  approvalUrl?: string       // PayPal 前端用
  qrCodeUrl?: string         // 支付宝二维码 URL
}

interface PaymentProvider {
  name: string
  createPayment(intent: PaymentIntent): Promise<PaymentResult>
  retrievePayment(transactionId: string): Promise<PaymentStatus>
  processRefund(transactionId: string, amount?: number): Promise<RefundResult>
  verifyWebhook(payload: unknown, signature: string): Promise<WebhookEvent>
}
```

## 二、Stripe 集成

### 2.1 方案选择

采用 **Stripe Payment Intents API** + **Stripe Elements** (前端 UI 组件)。

```
流程：
1. 后端创建 PaymentIntent → 返回 clientSecret
2. 前端用 Stripe Elements 渲染支付表单
3. 用户提交 → Stripe 直接处理 → 返回结果
4. Webhook 异步通知后端 → 更新订单状态
```

### 2.2 前端集成代码架构

```typescript
// client/src/components/checkout/StripePaymentForm.tsx
import { Elements, PaymentElement } from '@stripe/react-stripe-js'
import { loadStripe } from '@stripe/stripe-js'

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)

export default function StripePaymentForm({ clientSecret }: { clientSecret: string }) {
  return (
    <Elements stripe={stripePromise} options={{ clientSecret }}>
      <CheckoutForm />
    </Elements>
  )
}
```

### 2.3 后端关键代码架构

```typescript
// server/src/services/payment/stripe.service.ts

class StripeService implements PaymentProvider {
  name = 'stripe'

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: intent.amount,
      currency: intent.currency,
      description: intent.description,
      metadata: {
        orderId: intent.orderId,
        ...intent.metadata,
      },
      receipt_email: intent.customerEmail,
      automatic_payment_methods: { enabled: true },
    })

    // 保存支付记录
    await db.insert(payments).values({
      orderId: intent.orderId,
      provider: 'stripe',
      transactionId: paymentIntent.id,
      status: 'pending',
      amount: intent.amount / 100,
      currency: intent.currency,
    })

    return {
      success: true,
      provider: 'stripe',
      transactionId: paymentIntent.id,
      status: 'processing',
      clientSecret: paymentIntent.client_secret!,
    }
  }

  async verifyWebhook(payload: string, signature: string): Promise<WebhookEvent> {
    const event = stripe.webhooks.constructEvent(
      payload, signature, process.env.STRIPE_WEBHOOK_SECRET
    )

    switch (event.type) {
      case 'payment_intent.succeeded':
        return { type: 'payment_succeeded', transactionId: event.data.object.id }
      case 'payment_intent.payment_failed':
        return { type: 'payment_failed', transactionId: event.data.object.id }
      default:
        return { type: 'unknown', transactionId: event.data.object.id }
    }
  }
}
```

### 2.4 Stripe 环境变量

```env
STRIPE_SECRET_KEY=sk_live_xxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxx
STRIPE_TEST_MODE=false
```

## 三、PayPal 集成

### 3.1 方案选择

采用 **PayPal JavaScript SDK** + **Orders API v2**。

```
流程：
1. 前端加载 PayPal JS SDK
2. 后端创建 PayPal Order → 返回 orderID
3. 前端渲染 PayPal 按钮
4. 用户点击 → PayPal 弹窗 → 登录/支付
5. onApprove 回调 → 前端调用后端 capture 接口
6. 后端 capture 订单 → 更新数据库
```

### 3.2 后端关键代码架构

```typescript
// server/src/services/payment/paypal.service.ts

class PayPalService implements PaymentProvider {
  name = 'paypal'

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    const request = new paypal.orders.OrdersCreateRequest()
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: intent.currency,
          value: (intent.amount / 100).toFixed(2),
        },
        description: intent.description,
        reference_id: intent.orderId,
      }],
      application_context: {
        return_url: intent.returnUrl,
        cancel_url: intent.cancelUrl,
        shipping_preference: 'SET_PROVIDED_ADDRESS',
      },
    })

    const response = await paypalClient.execute(request)

    return {
      success: true,
      provider: 'paypal',
      transactionId: response.result.id,
      status: 'processing',
      approvalUrl: response.result.links.find(l => l.rel === 'approve')?.href,
    }
  }

  async captureOrder(orderId: string): Promise<PaymentResult> {
    const request = new paypal.orders.OrdersCaptureRequest(orderId)
    const response = await paypalClient.execute(request)

    return {
      success: response.result.status === 'COMPLETED',
      provider: 'paypal',
      transactionId: orderId,
      status: response.result.status === 'COMPLETED' ? 'succeeded' : 'failed',
    }
  }
}
```

### 3.3 PayPal 环境变量

```env
PAYPAL_CLIENT_ID=AXxxxxx
PAYPAL_CLIENT_SECRET=ELxxxxx
PAYPAL_MODE=live    # sandbox | live
PAYPAL_WEBHOOK_ID=xxxxx
```

## 四、Alipay Global 集成

### 4.1 方案选择

采用 **Alipay Global Cross-border Website Payment**（电脑网站支付）。

支持两种模式：
- **Page Pay（页面跳转）**：用户跳转到支付宝页面支付 → 支付完成跳回
- **QR Code Pay（扫码支付）**：生成二维码 → 用户扫码 → 轮询结果

优先采用 Page Pay 模式。

### 4.2 后端关键代码架构

```typescript
// server/src/services/payment/alipay.service.ts

class AlipayService implements PaymentProvider {
  name = 'alipay'

  async createPayment(intent: PaymentIntent): Promise<PaymentResult> {
    const params = {
      out_trade_no: intent.orderId,
      product_code: 'NEW_OVERSEAS_SELLER',
      total_amount: (intent.amount / 100).toFixed(2),
      subject: intent.description,
      currency: intent.currency,
      return_url: intent.returnUrl,
      notify_url: `${process.env.API_BASE_URL}/api/webhooks/alipay`,
    }

    const signedParams = this.signParams(params)
    const redirectUrl = `${ALIPAY_GATEWAY}?${new URLSearchParams(signedParams)}`

    return {
      success: true,
      provider: 'alipay',
      transactionId: intent.orderId,
      status: 'processing',
      redirectUrl,
    }
  }

  async verifyWebhook(params: Record<string, string>): Promise<WebhookEvent> {
    // 验证签名
    const verified = alipaySdk.checkNotifySign(params)
    if (!verified) throw new Error('Invalid Alipay signature')

    const tradeStatus = params.trade_status
    if (tradeStatus === 'TRADE_SUCCESS' || tradeStatus === 'TRADE_FINISHED') {
      return {
        type: 'payment_succeeded',
        transactionId: params.trade_no,
        rawData: params,
      }
    }
    return { type: 'payment_failed', transactionId: params.trade_no }
  }
}
```

### 4.3 Alipay Global 环境变量

```env
ALIPAY_APP_ID=2021xxxxx
ALIPAY_PRIVATE_KEY=-----BEGIN RSA PRIVATE KEY-----
ALIPAY_PUBLIC_KEY=-----BEGIN PUBLIC KEY-----
ALIPAY_GATEWAY=https://openapi.alipay.com/gateway.do
ALIPAY_NOTIFY_URL=https://axiso.com/api/webhooks/alipay
```

## 五、支付 Webhook 统一处理

```typescript
// server/src/services/payment/webhook-handler.ts

async function handleStripeWebhook(req, res) {
  const event = await stripeService.verifyWebhook(req.body, req.headers['stripe-signature'])
  if (event.type === 'payment_succeeded') {
    await orderService.markAsPaid(event.transactionId)
    await inventoryService.deductStock(event.transactionId)
    await emailService.sendOrderConfirmation(event.transactionId)
  }
}

async function handlePayPalWebhook(req, res) {
  const event = await paypalService.verifyWebhook(req.headers, req.body)
  if (event.type === 'CHECKOUT.ORDER.APPROVED') {
    const capture = await paypalService.captureOrder(event.resource.id)
    if (capture.success) {
      await orderService.markAsPaid(event.resource.id)
      await emailService.sendOrderConfirmation(event.resource.id)
    }
  }
}

async function handleAlipayWebhook(req, res) {
  const event = await alipayService.verifyWebhook(req.body)
  if (event.type === 'payment_succeeded') {
    await orderService.markAsPaid(event.rawData.out_trade_no)
    await inventoryService.deductStock(event.rawData.out_trade_no)
    await emailService.sendOrderConfirmation(event.rawData.out_trade_no)
  }
  res.send('success') // 支付宝要求返回 success
}
```

## 六、支付方式智能路由

```typescript
// server/src/services/payment/router.ts

function getRecommendedProviders(country: string, currency: string): PaymentProvider[] {
  const providers: PaymentProvider[] = []

  // 所有国家都支持 Stripe
  providers.push(stripeService)

  // PayPal：欧美澳新 + 全球
  const paypalCountries = ['US','CA','GB','DE','FR','IT','ES','AU','NZ',
    'NL','BE','AT','CH','SE','NO','DK','FI','IE','PT','PL']
  if (paypalCountries.includes(country)) {
    providers.push(paypalService)
  }

  // Alipay Global：亚洲 + 中文用户
  const alipayCountries = ['CN','HK','SG','MY','TH','JP','KR','TW','MO']
  if (alipayCountries.includes(country)) {
    providers.push(alipayService)
  }

  return providers
}
```

## 七、支付安全措施清单

| 措施 | Stripe | PayPal | Alipay Global |
|------|--------|--------|---------------|
| Webhook/IPN 签名验证 | ✅ | ✅ | ✅ |
| 幂等键防重复 | ✅ PaymentIntent idempotency | ✅ PayPal-Request-Id | ✅ out_trade_no 唯一 |
| 金额校验 | ✅ Webhook 内核对金额 | ✅ | ✅ |
| SSL/TLS 强制 | ✅ | ✅ | ✅ |
| PCI DSS 合规 | ✅ 令牌化 | ✅ 令牌化 | ✅ 页面跳转 |
| 3D Secure | ✅ 自动 | N/A | N/A |
| 退款支持 | ✅ API | ✅ API | ✅ API |
| Rate Limiting | 自定义 | 自定义 | 自定义 |
