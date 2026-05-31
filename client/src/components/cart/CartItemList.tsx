import { Link } from 'react-router-dom'
import { Minus, Plus, Trash2 } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { useTranslation, useLanguage } from '@/i18n'

export default function CartItemList() {
  const { items, removeItem, updateItem, isLoading, isUpdating } = useCartStore()
  const { t } = useTranslation()
  const { lang } = useLanguage()

  if (isLoading) {
    return (
      <div className="text-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-[#C89460] border-t-transparent mx-auto"></div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-xl font-['Playfair_Display'] text-[#3C2415] mb-3">{t('cart.empty')}</p>
        <p className="text-sm text-[#3C2415]/50 mb-8">{t('cart.emptyHint')}</p>
        <Link
          to={`/${lang}/products`}
          className="inline-flex items-center gap-2 text-sm tracking-widest uppercase text-[#C89460] hover:text-[#3C2415] transition-colors border-b border-[#C89460] pb-1"
        >
          {t('cart.exploreProducts')}
        </Link>
      </div>
    )
  }

  const handleDecrease = (itemId: string, currentQuantity: number) => {
    if (isUpdating) return
    if (currentQuantity <= 1) {
      removeItem(itemId)
    } else {
      updateItem(itemId, currentQuantity - 1)
    }
  }

  const handleIncrease = (itemId: string, currentQuantity: number) => {
    if (isUpdating) return
    updateItem(itemId, currentQuantity + 1)
  }

  const handleRemove = (itemId: string) => {
    if (isUpdating) return
    removeItem(itemId)
  }

  return (
    <div className="space-y-6">
      {items.map((item) => (
        <div key={item.id} className="flex gap-5 py-6 border-b border-[#3C2415]/5">
          <Link
            to={`/${lang}/products/${item.productId}`}
            className="w-24 h-32 flex-shrink-0 bg-[#F5F0E8] overflow-hidden"
          >
            {item.image ? (
              <img
                src={item.image}
                alt={item.productNameEn}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[#3C2415]/20">
                <span className="text-xs">{t('common.noImage')}</span>
              </div>
            )}
          </Link>

          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <div>
                <Link
                  to={`/${lang}/products/${item.productId}`}
                  className="text-sm text-[#3C2415] hover:text-[#C89460] transition-colors"
                >
                  {item.productName}
                </Link>
                <div className="flex gap-4 mt-1 text-xs text-[#3C2415]/40">
                  <span>{item.colorName}</span>
                  <span>{item.size}</span>
                </div>
              </div>
              <p className="text-sm text-[#3C2415]">
                ${item.price.toLocaleString()}
              </p>
            </div>

            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center border border-[#3C2415]/20">
                <button
                  onClick={() => handleDecrease(item.id, item.quantity)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 transition-colors ${
                    isUpdating
                      ? 'text-[#3C2415]/30 cursor-not-allowed'
                      : 'text-[#3C2415] hover:bg-[#3C2415]/5'
                  }`}
                  aria-label={t('product.decrease')}
                >
                  {isUpdating ? (
                    <div className="w-3 h-3 border-2 border-[#3C2415]/30 border-t-[#3C2415] rounded-full animate-spin"></div>
                  ) : (
                    <Minus size={12} />
                  )}
                </button>
                <span className="px-3 py-1.5 text-sm min-w-[2.5rem] text-center text-[#3C2415]">
                  {item.quantity}
                </span>
                <button
                  onClick={() => handleIncrease(item.id, item.quantity)}
                  disabled={isUpdating}
                  className={`px-3 py-1.5 transition-colors ${
                    isUpdating
                      ? 'text-[#3C2415]/30 cursor-not-allowed'
                      : 'text-[#3C2415] hover:bg-[#3C2415]/5'
                  }`}
                  aria-label={t('product.increase')}
                >
                  {isUpdating ? (
                    <div className="w-3 h-3 border-2 border-[#3C2415]/30 border-t-[#3C2415] rounded-full animate-spin"></div>
                  ) : (
                    <Plus size={12} />
                  )}
                </button>
              </div>

              <button
                onClick={() => handleRemove(item.id)}
                disabled={isUpdating}
                className={`transition-colors ${
                  isUpdating
                    ? 'text-[#3C2415]/15 cursor-not-allowed'
                    : 'text-[#3C2415]/30 hover:text-[#C17E60]'
                }`}
                aria-label={t('cart.remove')}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}