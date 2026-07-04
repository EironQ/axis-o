import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { productApi, Product } from '@/services/api'
import ImageGallery from '@/components/products/ImageGallery'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation, useLanguage } from '@/i18n'
import ProductInfo from '@/components/products/ProductInfo'
import ProductDescription from '@/components/products/ProductDescription'
import ProductDetailContent from '@/components/products/ProductDetailContent'
import SEO from '@/components/SEO'

export default function ProductDetailPage() {
  const { store } = useSettings()
  const { t } = useTranslation()
  const { lang } = useLanguage()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (id) {
      loadProduct(id)
    }
  }, [id])

  const loadProduct = async (productId: string) => {
    setIsLoading(true)
    try {
      const response = await productApi.getById(productId)
      if (response.success) {
        setProduct(response.data)
      }
    } catch (error) {
      console.error('Failed to load product:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center pt-24">
        <Loader2 className="w-8 h-8 animate-spin text-[#C89460] mx-auto" />
      </main>
    )
  }

  if (!product) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl font-['Playfair_Display'] text-[#3C2415] mb-3">
            {t('product.notFound')}
          </p>
          <Link
            to={`/${lang}/products`}
            className="text-sm text-[#C89460] hover:text-[#3C2415] transition-colors border-b border-[#C89460] pb-1"
          >
            {t('product.backToList')}
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <SEO
        title={lang === 'zh' ? (product.metaTitleZh || product.nameZh) : (product.metaTitleEn || product.nameEn)}
        description={lang === 'zh' ? (product.metaDescriptionZh || product.descriptionZh) : (product.metaDescriptionEn || product.descriptionEn)}
        image={product.images?.[0]}
        url={`/${lang}/products/${product.id}`}
      />
      <div className="mx-auto max-w-[1440px] px-8 pt-24 pb-6">
        <div className="flex items-center gap-2 text-xs text-[#3C2415]/40 mb-8">
          <Link to={`/${lang}`} className="hover:text-[#C89460] transition-colors">{t('nav.home')}</Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <Link
            to={`/${lang}/products?series=${product.series}`}
            className="hover:text-[#C89460] transition-colors"
          >
            {product.series === 'classic' ? t('product.classic') : product.series === 'luxe' ? t('product.luxe') : t('product.travel')}
          </Link>
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-[#3C2415]/60">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <ImageGallery images={product.images.map(img => typeof img === 'string' ? img : img.url)} productName={product.name} />
          <ProductInfo product={product} />
        </div>
        <ProductDescription product={product} />
        {product.detailImages && product.detailImages.length > 0 && (
          <ProductDetailContent images={product.detailImages} />
        )}
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-24">
        <p className="text-sm tracking-[0.3em] uppercase text-[#C89460] mb-2 text-center">
          {t('product.shareYourStyle')}
        </p>
        <p className="text-2xl font-['Playfair_Display'] text-[#3C2415] text-center mb-2">
          @{store.store_name}
        </p>
        <p className="text-sm text-[#3C2415]/40 text-center">
          {t('product.tagUs')}
        </p>
      </div>
    </main>
  )
}
