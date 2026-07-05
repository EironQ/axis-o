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
  usePayPalScriptReducer,
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

function SubmitCardFields({ isProcessing, onError, t }: { isProcessing: boolean; onError: (err: string) => void; t: any }) {
  const { cardFieldsForm } = usePayPalCardFields()

  const handleClick = async () => {
    if (!cardFieldsForm) return
    try {
      const result = await cardFieldsForm.submit()
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
      disabled={isProcessing || !cardFieldsForm}
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

interface PayPalContentProps {
  t: any
  lang: 'zh' | 'en'
  paymentTab: 'card' | 'paypal'
  isProcessing: boolean
  paypalOrderId: string
  orderId: string
  amount: number
  currency: string
  onApprove: (data: { orderID: string }) => void
  onError: (err: string) => void
  onCancel: () => void
  setIsProcessing: (value: boolean) => void
  setMessage: (value: string | null) => void
  setMessageType: (value: 'success' | 'info' | 'error') => void
  setShowRetry: (value: boolean) => void
}

function PayPalContent(props: PayPalContentProps) {
  const [{ isResolved, isRejected }] = usePayPalScriptReducer()
  const [cardFieldsEligible, setCardFieldsEligible] = useState<boolean | null>(null)

  const createOrder = async () => props.paypalOrderId

  useEffect(() => {
    const checkEligibility = async () => {
      try {
        const paypalNamespace = (window as any).paypal
        if (paypalNamespace && paypalNamespace.CardFields) {
          const instance = await paypalNamespace.CardFields({
            createOrder: createOrder,
          })
          setCardFieldsEligible(instance.isEligible())
          instance.teardown?.()
        } else {
          setCardFieldsEligible(false)
        }
      } catch {
        setCardFieldsEligible(false)
      }
    }

    if (isResolved) {
      checkEligibility()
    }
  }, [isResolved, createOrder])

  if (isRejected) {
    return (
      <div className="text-center py-8 text-red-600 text-sm">
        {props.t('payment.paypalLoadFailed')}
      </div>
    )
  }

  if (!isResolved) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C89460] mr-3"></div>
        <span className="text-sm text-[#3C2415]/60">Loading PayPal...</span>
      </div>
    )
  }

  if (props.paymentTab === 'card' && cardFieldsEligible === false) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-[#3C2415]/60 mb-4">{props.t('payment.cardNotAvailable')}</p>
        <Button variant="outline" size="sm" onClick={() => {
          props.setMessage(null)
          props.setShowRetry(false)
        }}>
          {props.t('payment.usePayPal')}
        </Button>
      </div>
    )
  }

  return (
    <>
      {props.paymentTab === 'card' && (
        <PayPalCardFieldsProvider
          createOrder={createOrder}
          onApprove={(data) => Promise.resolve(props.onApprove(data))}
          onError={(err: Record<string, unknown>) => {
            console.error('[PayPal] Card fields error:', err)
            const errorMsg = typeof err?.message === 'string' ? err.message : props.t('payment.processFailed')
            if (errorMsg.includes('not eligible')) {
              props.setMessageType('error')
              props.setMessage(props.t('payment.cardNotAvailable'))
            } else {
              props.setMessageType('error')
              props.setMessage(errorMsg)
            }
            props.setShowRetry(true)
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
                {props.t('payment.cardNumber')}
              </label>
              <PayPalNumberField
                style={{ input: { fontSize: '14px' } }}
                placeholder="4111 1111 1111 1111"
              />
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-medium text-[#3C2415]/70">
                {props.t('payment.cardholderName')}
              </label>
              <PayPalNameField
                style={{ input: { fontSize: '14px' } }}
                placeholder={props.lang === 'zh' ? '姓名' : 'Full Name'}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="block text-xs font-medium text-[#3C2415]/70">
                  {props.t('payment.expiry')}
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
                isProcessing={props.isProcessing}
                onError={(err) => {
                  props.setMessageType('error')
                  props.setMessage(err)
                  props.onError(err)
                }}
                t={props.t}
              />
            </div>
          </div>
        </PayPalCardFieldsProvider>
      )}

      {props.paymentTab === 'paypal' && (
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
            onApprove={(data) => Promise.resolve(props.onApprove(data))}
            onError={(err: Record<string, unknown>) => {
              console.error('PayPal buttons error:', err)
              const errorMsg = typeof err?.message === 'string' ? err.message : props.t('payment.paypalLoadFailed')
              props.setMessageType('error')
              props.setMessage(errorMsg)
              props.setShowRetry(true)
              props.onError(errorMsg)
            }}
            onCancel={() => {
              props.setMessageType('info')
              props.setMessage(props.t('payment.cancelled'))
              props.onCancel()
            }}
            disabled={props.isProcessing}
          />
        </div>
      )}
    </>
  )
}

export default function PayPalPaymentForm(props: PayPalPaymentFormProps) {
  const { t, lang } = useTranslation()
  const [isProcessing, setIsProcessing] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [messageType, setMessageType] = useState<'success' | 'info' | 'error'>('info')
  const [showRetry, setShowRetry] = useState(false)
  const [paymentTab, setPaymentTab] = useState<'card' | 'paypal'>('card')
  const [currentPaypalOrderId, setCurrentPaypalOrderId] = useState(props.paypalOrderId)
  const retryCountRef = useRef(0)

  const clientId = props.clientId || FALLBACK_CLIENT_ID

  const refreshPayPalOrder = async () => {
    try {
      const { paymentApi } = await import('@/services/api')
      const response = await paymentApi.createIntent(props.orderId, 'paypal')
      if (response.success && response.data?.paypalOrderId) {
        setCurrentPaypalOrderId(response.data.paypalOrderId)
        return response.data.paypalOrderId
      }
    } catch (err) {
      console.error('[PayPal] Failed to refresh order:', err)
    }
    return null
  }

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
      let response = await paymentApi.capturePayPal(props.orderId, data.orderID)

      if (!response.success && response.error?.code === 'PAYPAL_ORDER_NOT_FOUND') {
        const refreshedOrderId = await refreshPayPalOrder()
        if (refreshedOrderId) {
          response = await paymentApi.capturePayPal(props.orderId, refreshedOrderId)
        }
      }

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
      if (errorMsg.includes('RESOURCE_NOT_FOUND') || errorMsg.includes('ORDER_NOT_FOUND')) {
        const refreshedOrderId = await refreshPayPalOrder()
        if (refreshedOrderId) {
          try {
            const { paymentApi } = await import('@/services/api')
            const response = await paymentApi.capturePayPal(props.orderId, refreshedOrderId)
            if (response.success) {
              setMessageType('success')
              setMessage(t('payment.success'))
              props.onSuccess(response.data.captureId)
              return
            }
          } catch (refreshErr) {
            console.error('[PayPal] Retry capture after refresh failed:', refreshErr)
          }
        }
      }
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
    setMessage(null)
    setShowRetry(false)
  }

  const paypalOptions: ReactPayPalScriptOptions = {
    clientId,
    currency: props.currency.toUpperCase(),
    intent: 'capture',
    components: 'buttons,card-fields',
    dataNamespace: 'paypal',
    enableFunding: 'card',
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">{t('payment.orderNumber', { number: props.orderNumber })}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(props.amount, props.currency)}
          </span>
        </div>

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
            {t('payment.creditCard')}
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
        >
          <PayPalContent
            t={t}
            lang={lang}
            paymentTab={paymentTab}
            isProcessing={isProcessing}
            paypalOrderId={props.paypalOrderId}
            orderId={props.orderId}
            amount={props.amount}
            currency={props.currency}
            onApprove={handleApprove}
            onError={(err) => {
              setMessageType('error')
              setMessage(err)
              setShowRetry(true)
              props.onError(err)
            }}
            onCancel={() => {
              setMessageType('info')
              setMessage(t('payment.cancelled'))
              props.onCancel()
            }}
            setIsProcessing={setIsProcessing}
            setMessage={setMessage}
            setMessageType={setMessageType}
            setShowRetry={setShowRetry}
          />
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