import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react'
import { useCartStore } from '@/store/cartStore'
import { productApi } from '@/services/api'
import ProductCard from '@/components/products/ProductCard'

export default function BestSellersSection() {
  const [bestSellers, setBestSellers] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)
  const scrollRef = useRef<HTMLDivElement>(null)
  const addItem = useCartStore((s) => s.addItem)

  useEffect(() => {
    loadBestSellers()
  }, [])

  const loadBestSellers = async () => {
    try {
      const response = await productApi.list({ limit: 8, sort: 'newest' })
      if (response.success) {
        setBestSellers(response.data.products.filter((p: any) => p.isBestseller))
      }
    } catch (error) {
      console.error('Failed to load best sellers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const updateScrollButtons = useCallback(() => {
    if (!scrollRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current
    setCanScrollLeft(scrollLeft > 4)
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4)
  }, [])

  const scroll = useCallback((direction: 'left' | 'right') => {
    if (!scrollRef.current) return
    const cardWidth = 320
    const gap = 32
    const scrollAmount = cardWidth + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }, [])

  const handleQuickAdd = (productId: string) => {
    const product = bestSellers.find((p) => p.id === productId)
    if (product && product.variants && product.variants.length > 0) {
      const variant = product.variants[0]
      addItem(variant.id, 1)
    }
  }

  if (isLoading) {
    return (
      <section className="py-24 md:py-32 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#C89460]" />
        </div>
      </section>
    )
  }

  return (
    <section className="py-24 md:py-32 bg-[#F5F0E8]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="flex items-end justify-between mb-12">
          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              热销推荐
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
              客人心选
            </h2>
          </div>
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              className="w-10 h-10 rounded-full border border-[#3C2415]/20 flex items-center justify-center text-[#3C2415]/60 hover:text-[#3C2415] hover:border-[#3C2415]/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="向左滚动"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              className="w-10 h-10 rounded-full border border-[#3C2415]/20 flex items-center justify-center text-[#3C2415]/60 hover:text-[#3C2415] hover:border-[#3C2415]/40 transition-all disabled:opacity-20 disabled:cursor-not-allowed"
              aria-label="向右滚动"
            >
              <ChevronRight size={18} />
            </button>
            <Link
              to="/products"
              className="ml-2 text-sm tracking-widest uppercase text-[#3C2415]/60 hover:text-[#C89460] transition-colors border-b border-[#3C2415]/20 hover:border-[#C89460] pb-1"
            >
              查看全部
            </Link>
          </div>
          <Link
            to="/products"
            className="md:hidden text-sm tracking-widest uppercase text-[#3C2415]/60 hover:text-[#C89460] transition-colors border-b border-[#3C2415]/20 hover:border-[#C89460] pb-1"
          >
            查看全部
          </Link>
        </div>

        <div className="relative">
          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="flex gap-8 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-4"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
            }}
          >
            {bestSellers.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-[280px] sm:w-[300px] snap-start"
              >
                <ProductCard
                  product={product}
                  onQuickAdd={handleQuickAdd}
                />
              </div>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-[#3C2415]/5" />
        </div>
      </div>
    </section>
  )
}
