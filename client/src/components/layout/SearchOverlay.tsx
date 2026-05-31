import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X, Loader2, ArrowRight } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { Product, productApi } from '@/services/api'

interface SearchOverlayProps {
  isOpen: boolean
  onClose: () => void
}

export default function SearchOverlay({ isOpen, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()
  const { t } = useTranslation()
  const lang = localStorage.getItem('preferred_language') || 'zh'

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
    if (!isOpen) {
      setQuery('')
      setResults([])
      setShowResults(false)
    }
  }, [isOpen])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query.trim().length >= 2) {
        searchProducts(query)
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query])

  const searchProducts = async (searchQuery: string) => {
    setIsLoading(true)
    try {
      const response = await productApi.list({ lang, limit: 20 })
      if (response.success) {
        const filtered = response.data.products.filter((p) => {
          const nameMatch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (p.nameEn && p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()))
          const descMatch = (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (p.descriptionEn && p.descriptionEn.toLowerCase().includes(searchQuery.toLowerCase()))
          const seriesMatch = p.series && p.series.toLowerCase().includes(searchQuery.toLowerCase())
          return nameMatch || descMatch || seriesMatch
        })
        setResults(filtered)
        setShowResults(true)
      }
    } catch (error) {
      console.error('Search failed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductClick = (product: Product) => {
    onClose()
    navigate(`/${lang}/products/${product.id}`)
  }

  const handleViewAllResults = () => {
    onClose()
    navigate(`/${lang}/products?search=${encodeURIComponent(query)}`)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[100] bg-[#3C2415]/50 backdrop-blur-sm flex items-start justify-center pt-[15vh]"
      onClick={handleOverlayClick}
    >
      <div className="bg-white w-full max-w-2xl mx-4 rounded-lg shadow-2xl overflow-hidden animate-fadeIn">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-[#E5DDD3]">
          <Search size={20} className="text-[#3C2415]/50 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t('search.placeholder')}
            className="flex-1 text-lg text-[#3C2415] placeholder:text-[#3C2415]/40 focus:outline-none bg-transparent"
          />
          {isLoading && <Loader2 size={20} className="text-[#C89460] animate-spin flex-shrink-0" />}
          <button
            onClick={onClose}
            className="text-[#3C2415]/50 hover:text-[#3C2415] transition-colors flex-shrink-0"
            aria-label={t('common.close')}
          >
            <X size={20} />
          </button>
        </div>

        {showResults && (
          <div className="max-h-[50vh] overflow-y-auto">
            {results.length > 0 ? (
              <>
                <div className="py-2">
                  {results.slice(0, 6).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => handleProductClick(product)}
                      className="w-full flex items-center gap-4 px-6 py-3 hover:bg-[#F5F0E8] transition-colors text-left"
                    >
                      {product.images && product.images[0] && (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-[#3C2415] font-medium truncate">{product.name}</p>
                        <p className="text-[#3C2415]/50 text-sm">
                          {t(`product.${product.series}` as any)} · ¥{product.basePrice}
                        </p>
                      </div>
                      <ArrowRight size={16} className="text-[#C89460] flex-shrink-0" />
                    </button>
                  ))}
                </div>
                {results.length > 6 && (
                  <button
                    onClick={handleViewAllResults}
                    className="w-full py-3 text-sm text-[#C89460] hover:text-[#3C2415] transition-colors border-t border-[#E5DDD3] flex items-center justify-center gap-2"
                  >
                    {t('search.viewAllResults').replace('{count}', String(results.length))}
                    <ArrowRight size={14} />
                  </button>
                )}
              </>
            ) : (
              <div className="py-12 text-center">
                <p className="text-[#3C2415]/50">{t('search.noResults')}</p>
              </div>
            )}
          </div>
        )}

        {!showResults && query.length === 0 && (
          <div className="py-8 px-6">
            <p className="text-xs tracking-widest uppercase text-[#3C2415]/30 mb-4">
              {t('search.suggestions')}
            </p>
            <div className="flex flex-wrap gap-2">
              {['classic', 'luxe', 'travel'].map((series) => (
                <button
                  key={series}
                  onClick={() => setQuery(series)}
                  className="px-4 py-2 text-sm bg-[#F5F0E8] text-[#3C2415]/70 rounded-full hover:bg-[#E5DDD3] transition-colors"
                >
                  {t(`product.${series}` as any)}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}