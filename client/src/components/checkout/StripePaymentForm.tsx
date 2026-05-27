import { useState, useMemo, useEffect } from 'react'
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js'
import { loadStripe, StripeElementsOptions } from '@stripe/stripe-js'
import Button from '@/components/ui/Button'

const FALLBACK_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || ''

interface StripePaymentFormProps {
  clientSecret: string
  publishableKey: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

const paymentElementOptions = {
  layout: 'tabs' as const,
  defaultValues: {},
}

function formatDisplayAmount(amount: number, currency: string): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

function CheckoutForm({
  orderNumber,
  amount,
  currency,
  onSuccess,
  onError,
  onCancel,
}: Omit<StripePaymentFormProps, 'clientSecret' | 'orderId' | 'publishableKey'>) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const isReady = stripe && elements

  useEffect(() => {
    if (!stripe) return

    const url = new URL(window.location.href)
    const paymentIntentClientSecret = url.searchParams.get('payment_intent_client_secret')
    const redirectStatus = url.searchParams.get('redirect_status')

    if (paymentIntentClientSecret && redirectStatus) {
      stripe.retrievePaymentIntent(paymentIntentClientSecret).then(({ paymentIntent }) => {
        if (paymentIntent?.status === 'succeeded') {
          setMessage('支付成功！')
          onSuccess(paymentIntent.id)
        } else if (paymentIntent?.status === 'processing') {
          setMessage('支付处理中，请稍候...')
          onSuccess(paymentIntent.id)
        } else {
          setMessage('支付状态异常，请联系客服')
          onError('支付状态异常')
        }
      })

      url.searchParams.delete('payment_intent')
      url.searchParams.delete('payment_intent_client_secret')
      url.searchParams.delete('redirect_status')
      window.history.replaceState({}, '', url.toString())
    }
  }, [stripe])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    console.log('=== Stripe Payment Submit Start ===')
    console.log('Stripe initialized:', !!stripe)
    console.log('Elements initialized:', !!elements)

    if (!stripe || !elements) {
      console.error('Stripe or Elements not initialized')
      setMessage('支付组件未就绪，请刷新页面重试')
      console.log('=== Stripe Payment Submit End (not initialized) ===')
      return
    }

    setIsProcessing(true)
    setMessage(null)

    try {
      console.log('Calling stripe.confirmPayment...')
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.href,
        },
        redirect: 'if_required',
      })
      console.log('Stripe confirmPayment response:', { error, paymentIntent: paymentIntent ? { id: paymentIntent.id, status: paymentIntent.status } : null })

      if (error) {
        console.error('Stripe payment error:', JSON.stringify(error, null, 2))
        const errorMessage = error.type === 'card_error' || error.type === 'validation_error'
          ? error.message
          : '支付失败，请重试'
        setMessage(errorMessage)
        onError(error.message || '支付失败')
        setIsProcessing(false)
      } else if (paymentIntent) {
        console.log('Payment intent status:', paymentIntent.status)
        if (paymentIntent.status === 'succeeded') {
          setMessage('支付成功！')
          onSuccess(paymentIntent.id)
        } else if (paymentIntent.status === 'processing') {
          setMessage('支付处理中，请稍候...')
          onSuccess(paymentIntent.id)
        } else if (paymentIntent.status === 'requires_action') {
          setMessage('正在验证...')
          try {
            console.log('Calling stripe.handleCardAction...')
            const { error: actionError, paymentIntent: updatedPaymentIntent } = await stripe.handleCardAction(
              paymentIntent.client_secret!
            )
            console.log('Card action response:', { actionError, updatedPaymentIntent: updatedPaymentIntent ? { id: updatedPaymentIntent.id, status: updatedPaymentIntent.status } : null })
            if (actionError) {
              console.error('Card action error:', JSON.stringify(actionError, null, 2))
              setMessage(actionError.message || '验证失败，请重试')
              onError(actionError.message || '验证失败')
              setIsProcessing(false)
            } else if (updatedPaymentIntent && updatedPaymentIntent.status === 'succeeded') {
              setMessage('支付成功！')
              onSuccess(updatedPaymentIntent.id)
            } else {
              setMessage('验证未完成，请重试')
              setIsProcessing(false)
            }
          } catch (actionErr) {
            console.error('Handle card action exception:', actionErr)
            setMessage('验证过程中发生错误，请重试')
            onError('验证失败')
            setIsProcessing(false)
          }
        } else {
          console.warn('Payment intent status:', paymentIntent.status)
          setMessage('支付状态未知，请联系客服')
          setIsProcessing(false)
        }
      } else {
        setMessage('支付未完成，请重试')
        setIsProcessing(false)
      }
    } catch (err) {
      console.error('Unexpected payment error:', err)
      setMessage('支付过程中发生错误，请重试')
      onError('支付失败')
      setIsProcessing(false)
    }
    console.log('=== Stripe Payment Submit End ===')
  }

  if (!isReady) {
    return (
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent mx-auto mb-4" />
        <p className="text-sm text-[#3C2415]/60">正在加载支付组件...</p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C89460]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
          </svg>
          支付方式
        </h3>

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">订单 {orderNumber}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(amount, currency)}
          </span>
        </div>

        <PaymentElement
          id="payment-element"
          options={paymentElementOptions}
        />

        {message && (
          <div className={`mt-4 p-4 rounded-lg text-sm ${
            message.includes('成功')
              ? 'bg-green-50 border border-green-200 text-green-700'
              : message.includes('处理中')
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message}
          </div>
        )}
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          size="lg"
          className="flex-1"
          onClick={onCancel}
          disabled={isProcessing}
        >
          返回订单
        </Button>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={isProcessing}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              处理中...
            </span>
          ) : (
            `确认支付 ${formatDisplayAmount(amount, currency)}`
          )}
        </Button>
      </div>
    </form>
  )
}

export default function StripePaymentForm(props: StripePaymentFormProps) {
  const stripePromise = useMemo(() => {
    const key = props.publishableKey || FALLBACK_KEY
    if (!key) return null
    return loadStripe(key)
  }, [props.publishableKey])

  if (!stripePromise) {
    return (
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
        <p className="text-sm text-[#3C2415]/60 mb-4">支付服务暂不可用</p>
        <Button variant="outline" size="sm" onClick={props.onCancel}>
          返回
        </Button>
      </div>
    )
  }

  const options: StripeElementsOptions = {
    clientSecret: props.clientSecret,
    appearance: {
      theme: 'stripe',
      variables: {
        colorPrimary: '#3C2415',
        colorBackground: '#FAF7F2',
        colorText: '#3C2415',
        colorDanger: '#EF4444',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        borderRadius: '8px',
        spacingUnit: '4px',
      },
      labels: 'floating',
    },
  }

  return (
    <Elements stripe={stripePromise} options={options}>
      <CheckoutForm
        orderNumber={props.orderNumber}
        amount={props.amount}
        currency={props.currency}
        onSuccess={props.onSuccess}
        onError={props.onError}
        onCancel={props.onCancel}
      />
    </Elements>
  )
}
