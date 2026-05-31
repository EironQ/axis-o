import { useState, useCallback, useRef } from 'react'
import { Minus, Plus, Check } from 'lucide-react'
import { Product, ProductVariant } from '@/services/api'
import { useCartStore } from '@/store/cartStore'
import { useCartAnimationStore } from '@/store/cartAnimationStore'
import { useTranslation } from '@/i18n'
import Button from '@/components/ui/Button'
import CartAnimation from './CartAnimation'

interface ProductInfoProps {
  product: Product
}

export default function ProductInfo({ product }: ProductInfoProps) {
  const { t } = useTranslation()
  const [selectedColor, setSelectedColor] = useState<string>(product.variants[0]?.colorName || '')
  const [selectedSize, setSelectedSize] = useState<string>(product.variants[0]?.size || '')
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [animations, setAnimations] = useState<{ id: number; startX: number; startY: number; endX: number; endY: number }[]>([])
  const addItem = useCartStore((s) => s.addItem)
  const cartIconRef = useCartAnimationStore((s) => s.cartIconRef)
  const animationIdCounter = useRef(0)

  const getUniqueColors = () => {
    const colorMap = new Map<string, string>()
    product.variants.forEach((variant) => {
      if (!colorMap.has(variant.colorName)) {
        colorMap.set(variant.colorName, variant.colorHex)
      }
    })
    return Array.from(colorMap.entries()).map(([name, hex]) => ({ name, hex }))
  }

  const getSizesForColor = (colorName: string) => {
    const sizePriority: Record<string, number> = {
      '迷你': 1,
      '小号': 2,
      '中号': 3,
      '大号': 4,
      '标准': 5,
      '均码': 6,
      '14寸': 7,
      '15.6寸': 8,
    }
    return product.variants
      .filter((v) => v.colorName === colorName)
      .map((v) => v.size)
      .sort((a, b) => (sizePriority[a] || 99) - (sizePriority[b] || 99))
  }

  const getCurrentVariant = (): ProductVariant | undefined => {
    return product.variants.find(
      (v) => v.colorName === selectedColor && v.size === selectedSize
    )
  }

  const getPrice = () => {
    const basePrice = parseFloat(product.basePrice)
    const variant = getCurrentVariant()
    const adjustment = variant ? parseFloat(variant.priceAdjustment) : 0
    return basePrice + adjustment
  }

  const handleAddToCart = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    const currentColor = selectedColor
    const currentSize = selectedSize
    const currentQty = quantity
    
    const variant = product.variants.find(
      (v) => v.colorName === currentColor && v.size === currentSize
    )
    if (!variant) return

    const buttonRect = e.currentTarget.getBoundingClientRect()
    const startX = buttonRect.left + buttonRect.width / 2 - 16
    const startY = buttonRect.top + buttonRect.height / 2 - 16

    let endX = startX
    let endY = startY

    if (cartIconRef?.current) {
      const cartRect = cartIconRef.current.getBoundingClientRect()
      endX = cartRect.left + cartRect.width / 2 - 16
      endY = cartRect.top + cartRect.height / 2 - 16
    }

    const newAnimation = {
      id: animationIdCounter.current++,
      startX,
      startY,
      endX,
      endY,
    }
    setAnimations((prev) => [...prev, newAnimation])

    await addItem(variant.id, currentQty)
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const removeAnimation = useCallback((id: number) => {
    setAnimations((prev) => prev.filter((a) => a.id !== id))
  }, [])

  const colors = getUniqueColors()
  const sizes = getSizesForColor(selectedColor)

  return (
    <div className="md:sticky md:top-28">
      <p className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-2">
        {product.series === 'classic' ? t('product.classic') : product.series === 'luxe' ? t('product.luxe') : t('product.travel')}
      </p>
      <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-4">
        {product.name}
      </h1>
      <p className="text-2xl text-[#3C2415] mb-2">
        ${getPrice().toLocaleString()}
      </p>
      <p className="text-xs text-[#3C2415]/40 mb-8">{t('product.taxIncluded')}</p>

      <p className="text-[#3C2415]/70 leading-relaxed mb-8">
        {product.description}
      </p>

      <div className="mb-6">
        <p className="text-xs tracking-wider uppercase text-[#3C2415]/50 mb-3">{t('product.color')}</p>
        <div className="flex gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              onClick={() => {
                setSelectedColor(color.name)
                const newSizes = getSizesForColor(color.name)
                if (!newSizes.includes(selectedSize)) {
                  setSelectedSize(newSizes[0])
                }
              }}
              className={`relative w-10 h-10 rounded-full border-2 transition-all ${
                selectedColor === color.name
                  ? 'border-[#3C2415] scale-110'
                  : 'border-transparent hover:border-[#3C2415]/30'
              }`}
              style={{ backgroundColor: color.hex }}
              aria-label={color.name}
            >
              {selectedColor === color.name && (
                <Check size={12} className="absolute inset-0 m-auto text-white drop-shadow-sm" />
              )}
            </button>
          ))}
        </div>
        <p className="text-xs text-[#3C2415]/50 mt-2">{selectedColor}</p>
      </div>

      <div className="mb-8">
        <p className="text-xs tracking-wider uppercase text-[#3C2415]/50 mb-3">{t('product.size')}</p>
        <div className="flex gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => setSelectedSize(size)}
              className={`px-5 py-2 text-sm border transition-all duration-300 ${
                selectedSize === size
                  ? 'border-[#3C2415] bg-[#3C2415] text-[#FAF7F2]'
                  : 'border-[#3C2415]/20 text-[#3C2415] hover:border-[#3C2415]/50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs tracking-wider uppercase text-[#3C2415]/50 mb-3">{t('product.quantity')}</p>
        <div className="flex items-center border border-[#3C2415]/20 w-fit">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="px-4 py-2 text-[#3C2415] hover:bg-[#3C2415]/5 transition-colors"
            aria-label={t('product.decrease')}
          >
            <Minus size={14} />
          </button>
          <span className="px-4 py-2 text-sm min-w-[3rem] text-center text-[#3C2415]">
            {quantity}
          </span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="px-4 py-2 text-[#3C2415] hover:bg-[#3C2415]/5 transition-colors"
            aria-label={t('product.increase')}
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        className="w-full mb-3"
        onClick={handleAddToCart}
      >
        {added ? t('product.addedToCart') : `${t('product.addToCart')} · $${(getPrice() * quantity).toLocaleString()}`}
      </Button>

      <p className="text-xs text-[#3C2415]/40 leading-relaxed mt-4">
        {t('product.material')}: {product.material} · {t('product.madeInItaly')}
      </p>

      {animations.map((anim) => (
        <CartAnimation
          key={anim.id}
          startX={anim.startX}
          startY={anim.startY}
          endX={anim.endX}
          endY={anim.endY}
          onComplete={() => removeAnimation(anim.id)}
        />
      ))}
    </div>
  )
}
