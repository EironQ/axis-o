import { DetailImage } from '@/types'

interface ProductDetailContentProps {
  images: DetailImage[]
}

export default function ProductDetailContent({ images }: ProductDetailContentProps) {
  if (!images || images.length === 0) return null

  return (
    <div className="mt-20 border-t border-[#3C2415]/10 pt-12">
      <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-2 text-center">
        商品详情
      </h3>
      <p className="text-2xl font-['Playfair_Display'] text-[#3C2415] text-center mb-12">
        匠心细节，一览无余
      </p>

      <div className="space-y-16">
        {images.map((item, index) => (
          <div
            key={index}
            className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center ${
              index % 2 === 1 ? 'md:direction-rtl' : ''
            }`}
          >
            <div className={`${index % 2 === 1 ? 'md:order-2' : ''}`}>
              <div className="bg-[#F5F0E8] overflow-hidden aspect-[16/9]">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-full object-cover transition-transform duration-700 hover:scale-105"
                />
              </div>
            </div>
            <div className={`${index % 2 === 1 ? 'md:order-1' : ''}`}>
              <div className="max-w-md mx-auto md:mx-0">
                <span className="text-6xl font-['Playfair_Display'] text-[#C89460]/20 font-bold">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <h4 className="text-xl font-['Playfair_Display'] text-[#3C2415] mt-2 mb-4">
                  {item.title}
                </h4>
                <p className="text-[#3C2415]/60 leading-relaxed text-sm">
                  {item.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
