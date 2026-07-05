import { useState, useEffect, useRef } from 'react'
import {
  PayPalScriptProvider,
  PayPalButtons,
  PayPalCardFieldsProvider,
  PayPalNumberField,
  PayPalNameField,
  PayPalExpiryField,
  PayPalCVVField,
  usePayPalCardFields,
  ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js'
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

function SubmitCardFields({ isProcessing, onError }: { isProcessing: boolean; onError: (err: string) => void }) {
  const { cardFields } = usePayPalCardFields()
  const { t } = useTranslation()

  const handleClick = async () => {
    if (!cardFields) return
    try {
      const result = await cardFields.submit()
      console.log('[PayPal] Card fields submit result:', result)
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Card payment failed'
      console.error('[PayPal] Card fields submit error:', err)
      onError(errorMsg)
    }
  }

  return (
    <Button
      type="button"
      variant="primary"
      size="lg"
      className="w-full"
      onClick={handleClick}
      disabled={isProcessing || !cardFields}
    >
      {isProcessing ? (
        <span className="flex items-center justify-center gap-2">
          <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
          {t('payment.processing')}
        </span>
      ) : t('payment.payNow')}
    </Button>
  )
}

export default function PayPalPaymentForm(props: PayPalPaymentFormProps) {
  const { t } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info')
  const [showRetry, setShowRetry] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [scriptError, setScriptError] = useState<string | null>(null)
  const [paymentTab, setPaymentTab] = useState<'card' | 'paypal'>('card')
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
    components: 'buttons,card-fields',
  }

  const createOrder = async () => props.paypalOrderId

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">{t('payment.orderNumber', { number: props.orderNumber })}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(props.amount, props.currency)}
          </span>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#3C2415]/10 mb-6">
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              paymentTab === 'card'
                ? 'text-[#3C2415] border-b-2 border-[#C89460]'
                : 'text-[#3C2415]/50 hover:text-[#3C2415]/70'
            }`}
            onClick={() => setPaymentTab('card')}
          >
            {t({ zh: '信用卡/借记卡', en: 'Credit / Debit Card' })}
          </button>
          <button
            type="button"
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              paymentTab === 'paypal'
                ? 'text-[#3C2415] border-b-2 border-[#C89460]'
                : 'text-[#3C2415]/50 hover:text-[#3C2415]/70'
            }`}
            onClick={() => setPaymentTab('paypal')}
          >
            PayPal
          </button>
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
          {!isScriptLoaded && !scriptError && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C89460] mr-3"></div>
              <span className="text-sm text-[#3C2415]/60">Loading PayPal...</span>
            </div>
          )}
          {scriptError && (
            <div className="text-center py-8 text-red-600 text-sm">{scriptError}</div>
          )}

          {/* Card Fields Tab */}
          {paymentTab === 'card' && isScriptLoaded && (
            <PayPalCardFieldsProvider
              createOrder={createOrder}
              onApprove={handleApprove}
              onError={(err: Record<string, unknown>) => {
                console.error('[PayPal] Card fields error:', err)
                const errorMsg = typeof err?.message === 'string' ? err.message : t('payment.processFailed')
                setMessageType('error')
                setMessage(errorMsg)
                setShowRetry(true)
                props.onError(errorMsg)
              }}
              style={{
                input: {
                  fontSize: '14px',
                  fontFamily: 'inherit',
                  color: '#3C2415',
                  placeholderColor: '#3C241580',
                },
              }}
            >
              <div className="space-y-4">
                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#3C2415]/70">
                    {t({ zh: '卡号', en: 'Card Number' })}
                  </label>
                  <PayPalNumberField
                    style={{ input: { fontSize: '14px' } }}
                    placeholder="4111 1111 1111 1111"
                  />
                </div>

                <div className="space-y-3">
                  <label className="block text-xs font-medium text-[#3C2415]/70">
                    {t({ zh: '持卡人姓名', en: 'Cardholder Name' })}
                  </label>
                  <PayPalNameField
                    style={{ input: { fontSize: '14px' } }}
                    placeholder={t({ zh: '姓名', en: 'Full Name' })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-[#3C2415]/70">
                      {t({ zh: '有效期', en: 'Expiry' })}
                    </label>
                    <PayPalExpiryField
                      style={{ input: { fontSize: '14px' } }}
                      placeholder="MM/YY"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-xs font-medium text-[#3C2415]/70">
                      CVV
                    </label>
                    <PayPalCVVField
                      style={{ input: { fontSize: '14px' } }}
                      placeholder="123"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <SubmitCardFields
                    isProcessing={isProcessing}
                    onError={(err) => {
                      setMessageType('error')
                      setMessage(err)
                      props.onError(err)
                    }}
                  />
                </div>
              </div>
            </PayPalCardFieldsProvider>
          )}

          {/* PayPal Button Tab */}
          {paymentTab === 'paypal' && isScriptLoaded && (
            <div className="min-h-[150px]">
              <PayPalButtons
                style={{
                  shape: 'rect',
                  layout: 'vertical',
                  color: 'gold',
                  label: 'pay',
                  tagline: false,
                }}
                createOrder={createOrder}
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
          )}
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
