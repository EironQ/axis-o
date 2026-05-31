import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import CartItemList from '@/components/cart/CartItemList'
import OrderSummary from '@/components/cart/OrderSummary'
import { useCartStore } from '@/store/cartStore'
import { useTranslation, useLanguage } from '@/i18n'

export default function CartPage() {
  const { items, fetchCart, isLoading } = useCartStore()
  const { t } = useTranslation()
  const { lang } = useLanguage()

  useEffect(() => {
    fetchCart()
  }, [])

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-24 pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
            {t('cart.title')}
          </p>
          <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
            {!isLoading && items.length > 0 ? t('cart.yourItemsCount').replace('{count}', String(items.length)) : t('cart.yourItems')}
          </h1>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2">
            <CartItemList />
            {!isLoading && items.length > 0 && (
              <div className="mt-6">
                <Link
                  to={`/${lang}/products`}
                  className="text-sm text-[#3C2415]/50 hover:text-[#C89460] transition-colors"
                >
                  ← {t('cart.continueShopping')}
                </Link>
              </div>
            )}
          </div>
          <div>
            <OrderSummary />
          </div>
        </div>
      </div>
    </main>
  )
}