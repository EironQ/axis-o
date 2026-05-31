import { useNavigate } from 'react-router-dom'
import { useCartStore } from '@/store/cartStore'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation, useLanguage } from '@/i18n'
import Button from '@/components/ui/Button'

export default function OrderSummary() {
  const navigate = useNavigate()
  const { totalPrice, totalItems } = useCartStore()
  const { store } = useSettings()
  const { t } = useTranslation()
  const { lang } = useLanguage()

  if (totalItems === 0) return null

  const freeThreshold = (() => {
    const val = parseFloat(store.free_shipping_threshold)
    return isNaN(val) ? 200 : val
  })()
  const shippingFee = (() => {
    const val = parseFloat(store.shipping_fee)
    return isNaN(val) ? 50 : val
  })()
  const shipping = totalPrice >= freeThreshold ? 0 : shippingFee
  const total = totalPrice + shipping

  const handleCheckout = () => {
    navigate(`/${lang}/checkout`)
  }

  return (
    <div className="bg-[#F5F0E8] p-8">
      <h3 className="text-sm tracking-widest uppercase text-[#3C2415] mb-6">
        {t('cart.orderSummary')}
      </h3>

      <div className="space-y-4">
        <div className="flex justify-between text-sm">
          <span className="text-[#3C2415]/60">{t('cart.subtotal')}</span>
          <span className="text-[#3C2415]">${totalPrice.toLocaleString()}</span>
        </div>
        {shipping > 0 && (
          <>
            <div className="flex justify-between text-sm">
              <span className="text-[#3C2415]/60">{t('cart.shipping')}</span>
              <span className="text-[#3C2415]">${shipping}</span>
            </div>
            <p className="text-xs text-[#3C2415]/30">
              {t('cart.freeShippingThreshold').replace('{threshold}', freeThreshold.toLocaleString())}
            </p>
          </>
        )}
        <div className="border-t border-[#3C2415]/10 pt-4 flex justify-between">
          <span className="text-sm text-[#3C2415]">{t('cart.total')}</span>
          <span className="text-lg font-['Playfair_Display'] text-[#3C2415]">
            ${total.toLocaleString()}
          </span>
        </div>
      </div>

      <Button variant="primary" size="lg" className="w-full mt-8" onClick={handleCheckout}>
        {t('cart.checkout').replace('{count}', String(totalItems))}
      </Button>

      <p className="text-xs text-[#3C2415]/30 text-center mt-4">
        {t('cart.paymentMethods')}
      </p>
    </div>
  )
}