import { Product } from '@/types'
import { useTranslation } from '@/i18n'
import ProductCard from './ProductCard'

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

type ProductGridProduct = Product | ApiProduct

interface ProductGridProps {
  products: ProductGridProduct[]
}

export default function ProductGrid({ products }: ProductGridProps) {
  const { t } = useTranslation()

  if (products.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-[#3C2415]/50 text-lg">{t('product.noProducts')}</p>
        <p className="text-[#3C2415]/30 text-sm mt-2">{t('product.adjustFilter')}</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-5 md:gap-6">
      {products.map((product, i) => (
        <div
          key={product.id}
          className="animate-fadeIn"
          style={{ animationDelay: `${i * 60}ms` }}
        >
          <ProductCard product={product} />
        </div>
      ))}
    </div>
  )
}
