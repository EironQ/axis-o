import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { Product } from '@/types'

interface ProductImage {
  url: string
  altText?: string
  isPrimary?: number
}

interface ApiProduct {
  id: string
  name: string
  nameEn?: string
  nameZh?: string
  series: string
  description?: string
  descriptionEn?: string
  descriptionZh?: string
  images: ProductImage[]
  variants?: any[]
  basePrice: string | number
  isBestseller: number | boolean
  material?: string
  story?: string
  category?: string
  slug?: string
}

type ProductCardProduct = Product | ApiProduct

interface ProductCardProps {
  product: ProductCardProduct
  onQuickAdd?: (productId: string) => void
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const images = product.images as (string | ProductImage)[]
  const imageUrls = images.map(img => typeof img === 'string' ? img : img.url)
  const primaryImage = images.find((img) => typeof img !== 'string' && img.isPrimary) ? 
    (images.find((img) => typeof img !== 'string' && img.isPrimary) as ProductImage).url : 
    imageUrls[0]

  const price = 'price' in product ? product.price : parseFloat(String((product as ApiProduct).basePrice))
  const isBestSeller = 'isBestSeller' in product ? product.isBestSeller : Boolean((product as ApiProduct).isBestseller)

  return (
    <div className="group">
      <Link
        to={`/products/${product.id}`}
        className="block relative overflow-hidden bg-[#F5F0E8] aspect-[3/4]"
      >
        {primaryImage && (
          <img
            src={primaryImage}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        {isBestSeller && (
          <span className="absolute top-3 left-3 bg-[#C89460] text-white text-[10px] tracking-widest uppercase px-2.5 py-1">
            热销
          </span>
        )}
        {onQuickAdd && (
          <button
            onClick={(e) => {
              e.preventDefault()
              e.stopPropagation()
              onQuickAdd(product.id)
            }}
            className="absolute bottom-0 left-0 right-0 bg-[#3C2415] text-[#FAF7F2] text-sm py-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center gap-2"
          >
            快速加入 <ArrowRight size={14} />
          </button>
        )}
      </Link>
      <div className="mt-3 px-0.5">
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#C89460] mb-0.5">
          {product.series === 'classic' ? '经典系列' : product.series === 'luxe' ? '轻奢系列' : '旅行系列'}
        </p>
        <h3 className="text-sm md:text-base font-['Playfair_Display'] text-[#3C2415] truncate">
          {product.name}
        </h3>
        <p className="text-sm text-[#3C2415]/70 mt-1">
          ${price.toLocaleString()}
        </p>
      </div>
    </div>
  )
}
