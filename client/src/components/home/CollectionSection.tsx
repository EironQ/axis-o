import { Link } from 'react-router-dom'
import { ArrowRight } from 'lucide-react'
import { collections } from '@/data/products'
import { useTranslation, useLanguage } from '@/i18n'

export default function CollectionSection() {
  const { t } = useTranslation()
  const { lang } = useLanguage()

  return (
    <section className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="text-center mb-16">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
            {t('home.selectedSeries')}
          </p>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415]">
            {t('home.forEveryStyle')}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {collections.map((col, i) => (
            <Link
              key={col.id}
              to={`/${lang}${col.link}`}
              className="group relative overflow-hidden aspect-[4/5] bg-[#F5F0E8]"
            >
              <img
                src={col.image}
                alt={col.title}
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#3C2415]/60 via-transparent to-transparent" />
              <div
                className="absolute bottom-0 left-0 right-0 p-8 transition-transform duration-500 group-hover:-translate-y-2"
                style={{ transitionDelay: `${i * 100}ms` }}
              >
                <h3 className="font-['Playfair_Display'] text-2xl md:text-3xl text-white mb-2">
                  {col.id === 'classic' ? t('nav.classic') : col.id === 'luxe' ? t('nav.luxe') : t('nav.travel')}
                </h3>
                <p className="text-sm text-white/70 mb-5">{col.id === 'classic' ? t('home.classicDesc') : col.id === 'luxe' ? t('home.luxeDesc') : t('home.travelDesc')}</p>
                <span className="inline-flex items-center gap-2 text-white text-sm tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {t('home.exploreSeries')} <ArrowRight size={14} />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
