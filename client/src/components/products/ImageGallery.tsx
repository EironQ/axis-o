import { useState } from 'react'
import { ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [activeIndex, setActiveIndex] = useState(0)
  const [zoomed, setZoomed] = useState(false)

  const goTo = (index: number) => {
    if (index >= 0 && index < images.length) setActiveIndex(index)
  }

  const imageUrls = images

  return (
    <div className="flex flex-col-reverse md:flex-row gap-4">
      <div className="flex md:flex-col gap-3 overflow-x-auto md:overflow-visible">
        {imageUrls.map((img, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`flex-shrink-0 w-20 h-24 overflow-hidden border-2 transition-colors ${
              i === activeIndex ? 'border-[#C89460]' : 'border-transparent hover:border-[#3C2415]/20'
            }`}
          >
            <img
              src={img}
              alt={`${productName} ${i + 1}`}
              className="w-full h-full object-cover"
            />
          </button>
        ))}
      </div>

      <div className="relative flex-1 bg-[#F5F0E8] overflow-hidden group max-h-[500px]">
        <div
          className={`relative w-full aspect-[4/5] cursor-zoom-in ${
            zoomed ? 'cursor-zoom-out' : ''
          }`}
          onClick={() => setZoomed(!zoomed)}
        >
          <img
            src={imageUrls[activeIndex]}
            alt={productName}
            className={`w-full h-full object-cover transition-transform duration-500 ${
              zoomed ? 'scale-150' : 'group-hover:scale-105'
            }`}
            style={zoomed ? { transformOrigin: 'center center' } : undefined}
          />
        </div>

        <button
          className="absolute right-3 top-3 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={(e) => {
            e.stopPropagation()
            setZoomed(!zoomed)
          }}
          aria-label="放大"
        >
          <ZoomIn size={16} className="text-[#3C2415]" />
        </button>

        {imageUrls.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex - 1) }}
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
              disabled={activeIndex === 0}
              aria-label="上一张"
            >
              <ChevronLeft size={16} className="text-[#3C2415]" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goTo(activeIndex + 1) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30"
              disabled={activeIndex === imageUrls.length - 1}
              aria-label="下一张"
            >
              <ChevronRight size={16} className="text-[#3C2415]" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}
