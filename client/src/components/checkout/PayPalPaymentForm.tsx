import { useState } from 'react'
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js'
import Button from '@/components/ui/Button'

const FALLBACK_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID || ''

interface PayPalPaymentFormProps {
  clientId: string
  paypalOrderId: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  onSuccess: (captureId: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

function formatDisplayAmount(amount: number, currency: string): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function PayPalPaymentForm(props: PayPalPaymentFormProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const clientId = props.clientId || FALLBACK_CLIENT_ID

  if (!clientId) {
    return (
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
        <p className="text-sm text-[#3C2415]/60 mb-4">PayPal 支付服务暂不可用</p>
        <Button variant="outline" size="sm" onClick={props.onCancel}>
          返回
        </Button>
      </div>
    )
  }

  const handleApprove = async (data: { orderID: string }) => {
    setIsProcessing(true)
    setMessage(null)

    try {
      const { paymentApi } = await import('@/services/api')
      const response = await paymentApi.capturePayPal(props.orderId, data.orderID)

      if (response.success) {
        setMessage('支付成功！')
        props.onSuccess(response.data.captureId)
      } else {
        setMessage('支付捕获失败')
        props.onError('支付捕获失败')
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : '支付处理失败'
      setMessage(errorMsg)
      props.onError(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C89460]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
          </svg>
          使用 PayPal 支付
        </h3>

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">订单 {props.orderNumber}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(props.amount, props.currency)}
          </span>
        </div>

        <PayPalScriptProvider options={{
          clientId,
          currency: props.currency.toUpperCase(),
          intent: 'capture',
        }}>
          <PayPalButtons
            style={{
              shape: 'rect',
              layout: 'vertical',
              color: 'gold',
              label: 'pay',
              tagline: false,
            }}
            createOrder={async () => props.paypalOrderId}
            onApprove={handleApprove}
            onError={(err: Record<string, unknown>) => {
              const errorMsg = typeof err?.message === 'string' ? err.message : 'PayPal 加载失败'
              setMessage(errorMsg)
              props.onError(errorMsg)
            }}
            onCancel={() => {
              setMessage('支付已取消')
              props.onCancel()
            }}
            disabled={isProcessing}
          />
        </PayPalScriptProvider>

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
          onClick={props.onCancel}
          disabled={isProcessing}
        >
          返回订单
        </Button>
      </div>
    </div>
  )
}
