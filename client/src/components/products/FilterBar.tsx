import { useTranslation } from '@/i18n'

interface FilterBarProps {
  activeSeries: string
  onSeriesChange: (series: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  categories: { id: string; nameZh: string; nameEn: string }[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

function getSeriesOptions(t: (key: any) => string) {
  return [
    { value: '', label: t('product.filter.all') },
    { value: 'classic', label: t('product.classic') },
    { value: 'luxe', label: t('product.luxe') },
    { value: 'travel', label: t('product.travel') },
  ]
}

function getSortOptions(t: (key: any) => string) {
  return [
    { value: 'default', label: t('product.filter.default') },
    { value: 'price-asc', label: t('product.filter.priceAsc') },
    { value: 'price-desc', label: t('product.filter.priceDesc') },
  ]
}

export default function FilterBar({
  activeSeries,
  onSeriesChange,
  sortBy,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  const { t, lang } = useTranslation()
  const seriesOptions = getSeriesOptions(t)
  const sortOptions = getSortOptions(t)

  return (
    <div className="flex flex-col gap-3 py-4 sm:py-6 border-b border-[#3C2415]/10 sticky top-[72px] bg-[#FAF7F2]/95 backdrop-blur-sm z-40 -mx-4 px-4 sm:mx-0 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex gap-2 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {seriesOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSeriesChange(opt.value)}
              className={`px-4 py-1.5 sm:py-2 text-xs sm:text-sm tracking-wider transition-all duration-300 whitespace-nowrap flex-shrink-0 ${
                activeSeries === opt.value
                  ? 'bg-[#3C2415] text-[#FAF7F2]'
                  : 'bg-transparent text-[#3C2415]/60 hover:text-[#3C2415] hover:bg-[#3C2415]/5'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          className="px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm bg-transparent border border-[#3C2415]/20 text-[#3C2415]/70 focus:outline-none focus:border-[#C89460] cursor-pointer w-full sm:w-auto"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {categories.length > 0 && (
        <div className="flex gap-1.5 sm:gap-2 flex-nowrap overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-3 py-1 sm:px-4 sm:py-1.5 text-xs tracking-wider transition-all duration-300 rounded-full whitespace-nowrap flex-shrink-0 ${
              activeCategory === ''
                ? 'bg-[#C89460] text-white'
                : 'bg-transparent text-[#3C2415]/50 hover:text-[#C89460] border border-[#3C2415]/15'
            }`}
          >
            {t('product.filter.allCategories')}
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-3 py-1 sm:px-4 sm:py-1.5 text-xs tracking-wider transition-all duration-300 rounded-full whitespace-nowrap flex-shrink-0 ${
                activeCategory === cat.id
                  ? 'bg-[#C89460] text-white'
                  : 'bg-transparent text-[#3C2415]/50 hover:text-[#C89460] border border-[#3C2415]/15'
              }`}
            >
              {lang === 'en' ? cat.nameEn : cat.nameZh}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
