import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface RedirectPaymentFormProps {
  redirectUrl: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  onSuccess: (tradeNo: string) => void
  onError: (error: string) => void
  onCancel: () => void
  provider?: 'lianlianpay'
}

function formatDisplayAmount(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function RedirectPaymentForm(props: RedirectPaymentFormProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [message, setMessage] = useState<string | null>(null)

  const providerName = props.provider === 'lianlianpay' ? 'LianLian Pay' : 'Payment Provider'

  useEffect(() => {
    if (!isRedirecting) return
    if (countdown <= 0) {
      window.location.href = props.redirectUrl
      return
    }
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = props.redirectUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => clearInterval(timer)
  }, [isRedirecting, countdown, props.redirectUrl])

  const handlePayNow = () => {
    setIsRedirecting(true)
  }

  if (isRedirecting) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-[#FFF9F5] rounded-lg border border-[#C89460]/20">
        <div className="text-4xl mb-4">🔄</div>
        <h3 className="text-lg font-medium text-[#3C2415] mb-2">Redirecting to {providerName}</h3>
        <p className="text-sm text-[#3C2415]/60 mb-4">
          Redirecting in {countdown} seconds...
        </p>
        <p className="text-xs text-[#3C2415]/40">
          Please do not close this page
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center p-6 bg-[#FFF9F5] rounded-lg border border-[#C89460]/20">
      <div className="text-5xl mb-4">💳</div>
      <h3 className="text-lg font-medium text-[#3C2415] mb-2">Pay with {providerName}</h3>
      <p className="text-sm text-[#3C2415]/60 mb-1">Order #{props.orderNumber}</p>
      <p className="text-2xl font-semibold text-[#3C2415] mb-6">
        {formatDisplayAmount(props.amount, props.currency)}
      </p>
      <p className="text-xs text-[#3C2415]/50 mb-6 text-center max-w-xs">
        You will be redirected to {providerName} to complete your payment securely.
      </p>
      {message && (
        <div className={`mb-4 p-3 rounded-lg text-sm w-full text-center ${
          message.includes('success') ? 'bg-green-50 text-green-700' :
          message.includes('error') ? 'bg-red-50 text-red-700' :
          'bg-blue-50 text-blue-700'
        }`}>
          {message}
        </div>
      )}
      <div className="flex gap-3 w-full">
        <Button
          variant="outline"
          className="flex-1"
          onClick={props.onCancel}
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          className="flex-1"
          onClick={handlePayNow}
        >
          Proceed to Payment
        </Button>
      </div>
    </div>
  )
}
