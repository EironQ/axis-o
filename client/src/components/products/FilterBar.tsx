interface FilterBarProps {
  activeSeries: string
  onSeriesChange: (series: string) => void
  sortBy: string
  onSortChange: (sort: string) => void
  categories: { id: string; nameZh: string }[]
  activeCategory: string
  onCategoryChange: (categoryId: string) => void
}

const seriesOptions = [
  { value: '', label: '全部' },
  { value: 'classic', label: '经典系列' },
  { value: 'luxe', label: '轻奢系列' },
  { value: 'travel', label: '旅行系列' },
]

const sortOptions = [
  { value: 'default', label: '默认排序' },
  { value: 'price-asc', label: '价格从低到高' },
  { value: 'price-desc', label: '价格从高到低' },
]

export default function FilterBar({
  activeSeries,
  onSeriesChange,
  sortBy,
  onSortChange,
  categories,
  activeCategory,
  onCategoryChange,
}: FilterBarProps) {
  return (
    <div className="flex flex-col gap-4 py-6 border-b border-[#3C2415]/10 sticky top-[72px] bg-[#FAF7F2]/95 backdrop-blur-sm z-40">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex gap-2 flex-wrap">
          {seriesOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSeriesChange(opt.value)}
              className={`px-5 py-2 text-sm tracking-wider transition-all duration-300 ${
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
          className="px-4 py-2 text-sm bg-transparent border border-[#3C2415]/20 text-[#3C2415]/70 focus:outline-none focus:border-[#C89460] cursor-pointer"
        >
          {sortOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      {categories.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => onCategoryChange('')}
            className={`px-4 py-1.5 text-xs tracking-wider transition-all duration-300 rounded-full ${
              activeCategory === ''
                ? 'bg-[#C89460] text-white'
                : 'bg-transparent text-[#3C2415]/50 hover:text-[#C89460] border border-[#3C2415]/15'
            }`}
          >
            全部分类
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onCategoryChange(cat.id)}
              className={`px-4 py-1.5 text-xs tracking-wider transition-all duration-300 rounded-full ${
                activeCategory === cat.id
                  ? 'bg-[#C89460] text-white'
                  : 'bg-transparent text-[#3C2415]/50 hover:text-[#C89460] border border-[#3C2415]/15'
              }`}
            >
              {cat.nameZh}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
