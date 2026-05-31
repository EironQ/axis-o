import { useTranslation } from '@/i18n'
import { useLanguage } from '@/i18n'
import { Link } from 'react-router-dom'
import { ArrowRight, Leaf, Globe, Recycle, Award } from 'lucide-react'
import { homeImages } from '@/assets/images'

export default function SustainabilityPage() {
  const { t } = useTranslation()
  const { lang } = useLanguage()

  const initiatives = [
    {
      icon: Leaf,
      titleKey: 'sustainability.initiative1' as const,
      descKey: 'sustainability.initiative1Desc' as const,
      statKey: 'sustainability.stat1' as const,
    },
    {
      icon: Recycle,
      titleKey: 'sustainability.initiative2' as const,
      descKey: 'sustainability.initiative2Desc' as const,
      statKey: 'sustainability.stat2' as const,
    },
    {
      icon: Globe,
      titleKey: 'sustainability.initiative3' as const,
      descKey: 'sustainability.initiative3Desc' as const,
      statKey: 'sustainability.stat3' as const,
    },
    {
      icon: Award,
      titleKey: 'sustainability.initiative4' as const,
      descKey: 'sustainability.initiative4Desc' as const,
      statKey: 'sustainability.stat4' as const,
    },
  ]

  const stats = [
    { value: '15', unitKey: 'sustainability.unit1' as const, labelKey: 'sustainability.statLabel1' as const },
    { value: '100%', unitKey: '' as const, labelKey: 'sustainability.statLabel2' as const },
    { value: '50%', unitKey: '' as const, labelKey: 'sustainability.statLabel3' as const },
    { value: '0', unitKey: 'sustainability.unit4' as const, labelKey: 'sustainability.statLabel4' as const },
  ]

  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32 bg-[#6B705C]/10">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C] mb-4">
              {t('sustainability.title')}
            </p>
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl text-[#3C2415] mb-6">
              {t('sustainability.heading')}
            </h1>
            <p className="text-[#3C2415]/70 max-w-2xl mx-auto leading-relaxed">
              {t('sustainability.intro')}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="font-['Playfair_Display'] text-4xl md:text-5xl text-[#6B705C] mb-2">
                  {stat.value}
                  <span className="text-lg">{stat.unitKey ? t(stat.unitKey) : ''}</span>
                </div>
                <p className="text-sm text-[#3C2415]/70">{t(stat.labelKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C] mb-4">
                {t('sustainability.why')}
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
                {t('sustainability.whyHeading')}
              </h2>
              <p className="text-[#3C2415]/70 leading-relaxed mb-8">
                {t('sustainability.whyDesc')}
              </p>
              <p className="text-[#3C2415]/70 leading-relaxed mb-8">
                {t('sustainability.whyDesc2')}
              </p>
              <Link
                to={`/${lang}/about`}
                className="inline-flex items-center gap-2 text-[#6B705C] hover:text-[#3C2415] transition-colors"
              >
                {t('sustainability.learnBtn')}
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="aspect-[4/5] bg-[#E8DED0] overflow-hidden">
              <img
                src={homeImages.eco}
                alt={t('sustainability.why')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C] mb-4">
              {t('sustainability.initiatives')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
              {t('sustainability.initiativesHeading')}
            </h2>
            <p className="text-[#3C2415]/70 max-w-2xl mx-auto leading-relaxed">
              {t('sustainability.initiativesDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {initiatives.map((initiative, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
                <div className="w-12 h-12 rounded-full bg-[#6B705C]/10 flex items-center justify-center mb-4">
                  <initiative.icon size={20} className="text-[#6B705C]" />
                </div>
                <h4 className="text-sm font-medium text-[#3C2415] mb-2">
                  {t(initiative.titleKey)}
                </h4>
                <p className="text-xs text-[#3C2415]/50 mb-4">{t(initiative.descKey)}</p>
                <div className="text-[#6B705C] font-medium text-sm">
                  {t(initiative.statKey)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="aspect-[4/5] bg-[#E8DED0] overflow-hidden order-2 lg:order-1">
              <img
                src={homeImages.brandStory}
                alt={t('sustainability.impact')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C] mb-4">
                {t('sustainability.impact')}
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
                {t('sustainability.impactHeading')}
              </h2>
              <p className="text-[#3C2415]/70 leading-relaxed mb-8">
                {t('sustainability.impactDesc')}
              </p>
              <Link
                to={`/${lang}/products`}
                className="inline-flex items-center gap-2 text-[#6B705C] hover:text-[#3C2415] transition-colors"
              >
                {t('sustainability.shopBtn')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#6B705C]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-white mb-6">
            {t('sustainability.callToAction')}
          </h2>
          <p className="text-white/70 max-w-2xl mx-auto leading-relaxed mb-8">
            {t('sustainability.callToActionDesc')}
          </p>
          <Link
            to={`/${lang}/products`}
            className="inline-flex items-center gap-2 bg-white text-[#6B705C] px-6 py-3 rounded-full hover:bg-[#FAF7F2] transition-colors"
          >
            {t('sustainability.startBtn')}
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>
    </div>
  )
}