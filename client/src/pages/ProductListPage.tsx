import { useState, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { productApi, categoryApi, Category, Product } from '@/services/api'
import { useTranslation } from '@/i18n'
import FilterBar from '@/components/products/FilterBar'
import ProductGrid from '@/components/products/ProductGrid'

export default function ProductListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSeries = searchParams.get('series') || ''
  const initialSearch = searchParams.get('search') || ''
  const [activeSeries, setActiveSeries] = useState(initialSeries)
  const [activeCategory, setActiveCategory] = useState('')
  const [sortBy, setSortBy] = useState('default')
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useTranslation()

  useEffect(() => {
    const newSeries = searchParams.get('series') || ''
    setActiveSeries(newSeries)
  }, [searchParams])

  useEffect(() => {
    loadCategories()
  }, [])

  useEffect(() => {
    loadProducts()
  }, [activeCategory])

  const loadCategories = async () => {
    try {
      const result = await categoryApi.list()
      if (result.success) {
        setCategories(result.data.filter((c) => c.isActive))
      }
    } catch (error) {
      console.error('Failed to load categories:', error)
    }
  }

  const loadProducts = async () => {
    setIsLoading(true)
    try {
      const params: { category?: string } = {}
      if (activeCategory) params.category = activeCategory
      const response = await productApi.list(params)
      if (response.success) {
        setProducts(response.data.products)
      }
    } catch (error) {
      console.error('Failed to load products:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSeriesChange = (series: string) => {
    setActiveSeries(series)
    if (series) {
      setSearchParams({ series })
    } else {
      setSearchParams({})
    }
  }

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId)
  }

  const filtered = useMemo(() => {
    let result = activeSeries
      ? products.filter((p) => p.series === activeSeries)
      : [...products]

    if (initialSearch) {
      const searchLower = initialSearch.toLowerCase()
      result = result.filter((p) => {
        const nameMatch = p.name.toLowerCase().includes(searchLower) ||
          (p.nameEn && p.nameEn.toLowerCase().includes(searchLower))
        const descMatch = (p.description && p.description.toLowerCase().includes(searchLower)) ||
          (p.descriptionEn && p.descriptionEn.toLowerCase().includes(searchLower))
        const seriesMatch = p.series && p.series.toLowerCase().includes(searchLower)
        return nameMatch || descMatch || seriesMatch
      })
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => parseFloat(a.basePrice) - parseFloat(b.basePrice))
        break
      case 'price-desc':
        result.sort((a, b) => parseFloat(b.basePrice) - parseFloat(a.basePrice))
        break
    }

    return result
  }, [activeSeries, sortBy, products, initialSearch])

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#FAF7F2] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#C89460]" />
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-20 pb-8 sm:pt-24 sm:pb-16 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          {initialSearch ? (
            <>
              <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
                {t('search.viewAllResults').replace('{count}', String(filtered.length))}
              </p>
              <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
                "{initialSearch}"
              </h1>
            </>
          ) : (
            <>
              <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
                {t('product.allProducts')}
              </p>
              <h1 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
                {activeSeries
                  ? activeSeries === 'classic'
                    ? t('product.classic')
                    : activeSeries === 'luxe'
                    ? t('product.luxe')
                    : t('product.travel')
                  : t('product.exploreFullCollection')}
              </h1>
            </>
          )}
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-4 sm:px-8 pb-16 sm:pb-24">
        <FilterBar
          activeSeries={activeSeries}
          onSeriesChange={handleSeriesChange}
          sortBy={sortBy}
          onSortChange={setSortBy}
          categories={categories.map((c) => ({ id: c.id, nameZh: c.nameZh, nameEn: c.nameEn }))}
          activeCategory={activeCategory}
          onCategoryChange={handleCategoryChange}
        />
        <div className="mt-6 sm:mt-10">
          <ProductGrid products={filtered} />
        </div>
        {filtered.length > 0 && (
          <p className="text-center text-sm text-[#3C2415]/30 mt-12">
            {t('product.totalProducts').replace('{count}', String(filtered.length))}
          </p>
        )}
      </div>
    </main>
  )
}
