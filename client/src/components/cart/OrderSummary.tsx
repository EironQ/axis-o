import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import Button from '@/components/ui/Button'

export default function OrderSummary() {
  const navigate = useNavigate()
  const { totalPrice, totalItems } = useCartStore()

  if (totalItems === 0) return null

  const shipping = totalPrice > 2000 ? 0 : 50
  const total = totalPrice + shipping

  const handleCheckout = () => {
    navigate('/checkout')
  }

  return (
    <div className="bg-[#F5F0E8] p-8">
      <h3 className="text-sm tracking-widest uppercase text-[#3C2415] mb-6">
        订单摘要
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#3C2415]/60">小计</span>
          <span className="text-[#3C2415]">${totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-[#3C2415]/60">运费</span>
          <span className="text-[#3C2415]">
            {shipping === 0 ? '免费' : `$${shipping}`}
          </span>
        </div>
        {shipping > 0 && (
          <p className="text-xs text-[#3C2415]/30">
            满 $2,000 即可享受免费配送
          </p>
        )}
        <div className="border-t border-[#3C2415]/10 pt-4 flex justify-between">
          <span className="text-sm text-[#3C2415]">合计</span>
          <span className="text-lg font-['Playfair_Display'] text-[#3C2415]">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full mt-8" onClick={handleCheckout}>
        去结算 ({totalItems})
      </Button>

      <p className="text-xs text-[#3C2415]/30 text-center mt-4">
        支持 Stripe · PayPal · Alipay
      </p>
    </div>
  )
}