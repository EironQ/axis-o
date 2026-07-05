import { useState, useEffect, useRef } from 'react'
import { PayPalScriptProvider, PayPalButtons, ReactPayPalScriptOptions } from '@paypal/react-paypal-js'
import Button from '@/components/ui/Button'
import { useTranslation } from '@/i18n'

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
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info')
  const [showRetry, setShowRetry] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const retryCountRef = useRef(0)

  const clientId = props.clientId || FALLBACK_CLIENT_ID

  if (!clientId) {
    return (
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
        <p className="text-sm text-[#3C2415]/60 mb-4">{t('payment.paypalUnavailable')}</p>
        <Button variant="outline" size="sm" onClick={props.onCancel}>
          {t('payment.back')}
        </Button>
      </div>
    )
  }

  const handleApprove = async (data: { orderID: string }) => {
    setIsProcessing(true)
    setMessage(null)
    setShowRetry(false)

    try {
      const { paymentApi } = await import('@/services/api')
      const response = await paymentApi.capturePayPal(props.orderId, data.orderID)

      if (response.success) {
        setMessageType('success')
        setMessage(t('payment.success'))
        props.onSuccess(response.data.captureId)
      } else {
        setMessageType('error')
        setMessage(t('payment.captureFailed'))
        setShowRetry(true)
        props.onError(t('payment.captureFailed'))
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : t('payment.processFailed')
      setMessageType('error')
      setMessage(errorMsg)
      setShowRetry(true)
      props.onError(errorMsg)
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRetry = () => {
    retryCountRef.current += 1
    setScriptError(null)
    setIsScriptLoaded(false)
    setMessage(null)
    setShowRetry(false)
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isScriptLoaded && !scriptError) {
        setMessageType('error')
        setMessage(t('payment.paypalLoadFailed'))
        setShowRetry(true)
      }
    }, 15000)

    return () => clearTimeout(timer)
  }, [isScriptLoaded, scriptError, t])

  const paypalOptions: ReactPayPalScriptOptions = {
    clientId,
    currency: props.currency.toUpperCase(),
    intent: 'capture',
    components: 'buttons',
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-[#C89460]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M7.076 21.337H2.47a.641.641 0 01-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106z"/>
          </svg>
          {t('payment.payWithPayPal')}
        </h3>

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">{t('payment.orderNumber', { number: props.orderNumber })}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(props.amount, props.currency)}
          </span>
        </div>

        <PayPalScriptProvider
          options={paypalOptions}
          deferLoading={false}
          onScriptReady={() => {
            console.log('[PayPal] SDK loaded successfully')
            setIsScriptLoaded(true)
          }}
          onScriptError={(err) => {
            console.error('[PayPal] SDK load error:', err)
            setScriptError('PayPal SDK failed to load')
            setMessageType('error')
            setMessage(t('payment.paypalLoadFailed'))
            setShowRetry(true)
          }}
        >
          <div className="min-h-[150px]">
            {!isScriptLoaded && !scriptError && (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C89460] mr-3"></div>
                <span className="text-sm text-[#3C2415]/60">Loading PayPal...</span>
              </div>
            )}
            {scriptError && (
              <div className="text-center py-8 text-red-600 text-sm">{scriptError}</div>
            )}
            <PayPalButtons
              style={{
                shape: 'rect',
                layout: 'vertical',
                color: 'gold',
                label: 'pay',
                tagline: false,
              }}
              createOrder={async () => {
                return props.paypalOrderId
              }}
              onApprove={handleApprove}
              onError={(err: Record<string, unknown>) => {
                console.error('PayPal buttons error:', err)
                const errorMsg = typeof err?.message === 'string' ? err.message : t('payment.paypalLoadFailed')
                setMessageType('error')
                setMessage(errorMsg)
                setShowRetry(true)
                props.onError(errorMsg)
              }}
              onCancel={() => {
                setMessageType('info')
                setMessage(t('payment.cancelled'))
                setShowRetry(false)
                props.onCancel()
              }}
              disabled={isProcessing}
            />
          </div>
        </PayPalScriptProvider>

        {message && (
          <div className={`mt-4 p-4 rounded-lg text-sm ${
            messageType === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : messageType === 'info'
              ? 'bg-blue-50 border border-blue-200 text-blue-700'
              : 'bg-red-50 border border-red-200 text-red-600'
          }`}>
            {message}
          </div>
        )}
      </div>

      {showRetry && (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={props.onCancel}
          >
            {t('payment.backToOrder')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="lg"
            className="flex-1"
            onClick={handleRetry}
            disabled={retryCountRef.current >= 3}
          >
            Retry
            {retryCountRef.current > 0 && ` (${retryCountRef.current}/3)`}
          </Button>
        </div>
      )}

      {!showRetry && (
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="flex-1"
            onClick={props.onCancel}
            disabled={isProcessing}
          >
            {t('payment.backToOrder')}
          </Button>
        </div>
      )}
    </div>
  )
}
