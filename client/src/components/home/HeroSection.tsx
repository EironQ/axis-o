import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslation, useLanguage } from '@/i18n'

interface HeroSlide {
  id: string
  image: string
  title: string
  subtitle: string
  link: string
  linkText: string
  tags?: string[]
}

export default function HeroSection() {
  const [slides, setSlides] = useState<HeroSlide[]>([])
  const [current, setCurrent] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [imageError, setImageError] = useState<string | null>(null)
  const { t } = useTranslation()
  const { lang } = useLanguage()

  useEffect(() => {
    fetchBanners()
  }, [])

  // 切换slide时重置图片错误状态
  useEffect(() => {
    setImageError(null)
  }, [current])

  const fetchBanners = async () => {
    try {
      const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api'
      const response = await fetch(`${API_BASE}/banners`)
      const result = await response.json()
      if (result.success && result.data && result.data.length > 0) {
        setSlides(result.data)
        setCurrent(0)
      } else {
        setSlides([])
      }
    } catch {
      setSlides([])
    } finally {
      setLoading(false)
    }
  }

  const goTo = useCallback((index: number) => {
    if (isAnimating || slides.length === 0) return
    setIsAnimating(true)
    setCurrent(index)
    setTimeout(() => setIsAnimating(false), 600)
  }, [isAnimating, slides.length])

  const next = useCallback(() => {
    if (slides.length === 0) return
    goTo((current + 1) % slides.length)
  }, [current, goTo, slides.length])

  const prev = useCallback(() => {
    if (slides.length === 0) return
    goTo((current - 1 + slides.length) % slides.length)
  }, [current, goTo, slides.length])

  useEffect(() => {
    if (slides.length === 0) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [next, slides.length])

  if (loading) {
    return (
      <section className="relative h-screen overflow-hidden bg-[#3C2415] flex items-center justify-center">
        <div className="animate-pulse text-white/60 text-sm">{t('home.loading')}</div>
      </section>
    )
  }

  if (slides.length === 0) {
    return (
      <section className="relative h-screen overflow-hidden bg-[#3C2415] flex items-center justify-center">
        <div className="text-center">
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl text-white mb-4">
            {'Welcome to AXIS O'}
          </h1>
          <p className="text-white/60">{t('home.shopNow') || 'Explore our collection'}</p>
        </div>
      </section>
    )
  }

  const slide = slides[current] || slides[0]
  if (!slide) {
    return (
      <section className="relative h-screen overflow-hidden bg-[#3C2415] flex items-center justify-center">
        <div className="text-white/60">Loading banner...</div>
      </section>
    )
  }

  const getImageUrl = (path: string) => {
    if (!path) return ''
    if (path.startsWith('http://') || path.startsWith('https://')) return path
    if (path.startsWith('/')) return path
    return `/${path}`
  }

  return (
    <section className="relative h-screen overflow-hidden">
      <div
        className="absolute inset-0 transition-opacity duration-700"
        style={{ opacity: isAnimating ? 0.5 : 1 }}
      >
        {!imageError && slide.image ? (
          <img
            src={getImageUrl(slide.image)}
            alt={slide.title}
            className="w-full h-full object-cover"
            onError={() => setImageError(slide.id)}
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#5D4E37] via-[#3C2415] to-[#2A1F14]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-[#3C2415]/60 via-transparent to-transparent" />
      </div>

      <div className="absolute inset-0 flex items-center">
        <div className="mx-auto max-w-[1440px] w-full px-8">
          <div className="max-w-2xl animate-fadeIn">
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-7xl text-white leading-tight mb-6">
              {slide.title}
            </h1>
            <p className="text-base md:text-lg text-white/80 mb-6 tracking-wide">
              {slide.subtitle}
            </p>
            {'tags' in slide && slide.tags && (
              <div className="flex flex-wrap gap-3 mb-10">
                {slide.tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-block px-4 py-2 text-xs text-white/90 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              to={`/${lang}${slide.link}`}
              className="inline-flex items-center gap-2 border border-white/60 px-10 py-4 text-white text-sm tracking-[0.2em] uppercase hover:bg-white hover:text-[#3C2415] transition-all duration-300"
            >
              {slide.linkText}
            </Link>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex gap-3">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current ? 'bg-white w-6' : 'bg-white/40'
            }`}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>

      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors hidden md:block"
        aria-label={t('home.prevSlide')}
      >
        <ChevronLeft size={40} strokeWidth={1} />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors hidden md:block"
        aria-label={t('home.nextSlide')}
      >
        <ChevronRight size={40} strokeWidth={1} />
      </button>
    </section>
  )
}
