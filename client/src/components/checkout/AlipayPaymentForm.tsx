import { useState, useEffect } from 'react'
import Button from '@/components/ui/Button'

interface AlipayPaymentFormProps {
  redirectUrl: string
  orderId: string
  orderNumber: string
  amount: number
  currency: string
  onSuccess: (tradeNo: string) => void
  onError: (error: string) => void
  onCancel: () => void
}

function formatDisplayAmount(amount: number, currency: string): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
}

export default function AlipayPaymentForm(props: AlipayPaymentFormProps) {
  const [isRedirecting, setIsRedirecting] = useState(false)
  const [countdown, setCountdown] = useState(5)
  const [message, setMessage] = useState<string | null>(null)

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
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 100-16 8 8 0 000 16zm1-12h-2v4H8l4 4 4-4h-3V8z"/>
          </svg>
        </div>
        <h3 className="text-lg font-medium text-[#3C2415] mb-2">正在跳转到 Alipay+ 支付页面</h3>
        <p className="text-sm text-[#3C2415]/60 mb-4">
          {countdown > 0 ? `${countdown} 秒后自动跳转...` : '正在跳转...'}
        </p>
        <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
          <div
            className="bg-[#1677FF] h-2 rounded-full transition-all duration-1000"
            style={{ width: `${((5 - countdown) / 5) * 100}%` }}
          />
        </div>
        <p className="text-xs text-[#3C2415]/40">
          如果页面没有自动跳转，请
          <button
            onClick={() => window.location.href = props.redirectUrl}
            className="text-[#1677FF] hover:underline ml-1"
          >
            点击这里
          </button>
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white border border-[#3C2415]/10 rounded-lg p-6">
        <h3 className="text-sm font-medium text-[#3C2415] mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-[#1677FF]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 18a8 8 0 100-16 8 8 0 000 16zm-1-6h2v2h-2v-2zm0-8h2v6h-2V6z"/>
          </svg>
          使用 Alipay+ 支付
        </h3>

        <div className="flex items-center gap-3 mb-6 p-3 bg-[#F0F5FF] rounded-lg">
          <div className="flex -space-x-2">
            <div className="w-8 h-8 rounded-full bg-[#1677FF] flex items-center justify-center text-white text-xs font-bold border-2 border-white">A</div>
            <div className="w-8 h-8 rounded-full bg-[#FF6B00] flex items-center justify-center text-white text-xs font-bold border-2 border-white">G</div>
            <div className="w-8 h-8 rounded-full bg-[#03C75F] flex items-center justify-center text-white text-xs font-bold border-2 border-white">K</div>
          </div>
          <div className="text-xs text-[#3C2415]/60">
            <p className="font-medium text-[#3C2415]">Alipay+ 全球支付</p>
            <p>支持 Alipay、GCash、Kakao Pay、Touch 'n Go 等</p>
          </div>
        </div>

        <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#3C2415]/10">
          <span className="text-xs text-[#3C2415]/60">订单 {props.orderNumber}</span>
          <span className="text-sm font-medium text-[#3C2415]">
            {formatDisplayAmount(props.amount, props.currency)}
          </span>
        </div>

        <div className="bg-[#FFF7E6] border border-[#FFE7BA] rounded-lg p-4 mb-6">
          <p className="text-xs text-[#D48806]">
            点击下方按钮后将跳转到 Alipay+ 安全支付页面，您可以选择 Alipay、GCash、Kakao Pay 等方式完成支付。
          </p>
        </div>

        {message && (
          <div className={`mb-4 p-4 rounded-lg text-sm ${
            message.includes('成功')
              ? 'bg-green-50 border border-green-200 text-green-700'
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
          disabled={isRedirecting}
        >
          返回订单
        </Button>
        <Button
          type="button"
          variant="primary"
          size="lg"
          className="flex-1 bg-[#1677FF] hover:bg-[#1677FF]/90"
          onClick={handlePayNow}
          disabled={isRedirecting}
        >
          {isRedirecting ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
              跳转中...
            </span>
          ) : (
            `Alipay+ 支付 ${formatDisplayAmount(props.amount, props.currency)}`
          )}
        </Button>
      </div>
    </div>
  )
}
