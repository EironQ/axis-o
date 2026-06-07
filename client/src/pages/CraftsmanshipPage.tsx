import { useTranslation } from '@/i18n'
import { useLanguage } from '@/i18n'
import { Link } from 'react-router-dom'
import { ArrowRight, Check } from 'lucide-react'

export default function CraftsmanshipPage() {
  const { t } = useTranslation()
  const { lang } = useLanguage()

  const materials = [
    {
      titleKey: 'craftsmanship.material1' as const,
      descKey: 'craftsmanship.material1Desc' as const,
      icon: Check,
    },
    {
      titleKey: 'craftsmanship.material2' as const,
      descKey: 'craftsmanship.material2Desc' as const,
      icon: Check,
    },
    {
      titleKey: 'craftsmanship.material3' as const,
      descKey: 'craftsmanship.material3Desc' as const,
      icon: Check,
    },
    {
      titleKey: 'craftsmanship.material4' as const,
      descKey: 'craftsmanship.material4Desc' as const,
      icon: Check,
    },
  ]

  const processes = [
    {
      stepKey: 'craftsmanship.step1' as const,
      descKey: 'craftsmanship.step1Desc' as const,
    },
    {
      stepKey: 'craftsmanship.step2' as const,
      descKey: 'craftsmanship.step2Desc' as const,
    },
    {
      stepKey: 'craftsmanship.step3' as const,
      descKey: 'craftsmanship.step3Desc' as const,
    },
    {
      stepKey: 'craftsmanship.step4' as const,
      descKey: 'craftsmanship.step4Desc' as const,
    },
  ]

  return (
    <div className="min-h-screen">
      <section className="py-24 md:py-32 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('craftsmanship.title')}
            </p>
            <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl text-[#3C2415] mb-6">
              {t('craftsmanship.heading')}
            </h1>
            <p className="text-[#3C2415]/70 max-w-2xl mx-auto leading-relaxed">
              {t('craftsmanship.intro')}
            </p>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-white">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
                {t('craftsmanship.materials')}
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
                {t('craftsmanship.materialsHeading')}
              </h2>
              <p className="text-[#3C2415]/70 leading-relaxed mb-8">
                {t('craftsmanship.materialsDesc')}
              </p>
              <div className="space-y-4">
                {materials.map((material, index) => (
                  <div key={index} className="flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-[#C89460]/10 flex items-center justify-center flex-shrink-0">
                      <material.icon size={18} className="text-[#C89460]" />
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-[#3C2415] mb-1">
                        {t(material.titleKey)}
                      </h4>
                      <p className="text-xs text-[#3C2415]/50">
                        {t(material.descKey)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="aspect-[4/5] bg-[#E8DED0] overflow-hidden">
              <img
                src="/images/craftsmanship/1.jpg"
                alt={t('craftsmanship.materials')}
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-32 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8">
          <div className="text-center mb-16">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('craftsmanship.process')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
              {t('craftsmanship.processHeading')}
            </h2>
            <p className="text-[#3C2415]/70 max-w-2xl mx-auto leading-relaxed">
              {t('craftsmanship.processDesc')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {processes.map((process, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-[#C89460]/10 flex items-center justify-center mb-6">
                  <span className="font-['Playfair_Display'] text-2xl text-[#C89460]">
                    {String(index + 1).padStart(2, '0')}
                  </span>
                </div>
                <h4 className="text-sm font-medium text-[#3C2415] mb-3">
                  {t(process.stepKey)}
                </h4>
                <p className="text-xs text-[#3C2415]/50 leading-relaxed">
                  {t(process.descKey)}
                </p>
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
                src="/images/craftsmanship/2.jpg"
                alt={t('craftsmanship.care')}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
                {t('craftsmanship.care')}
              </p>
              <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6">
                {t('craftsmanship.careHeading')}
              </h2>
              <p className="text-[#3C2415]/70 leading-relaxed mb-8">
                {t('craftsmanship.careDesc')}
              </p>
              <Link
                to={`/${lang}/products`}
                className="inline-flex items-center gap-2 text-[#C89460] hover:text-[#3C2415] transition-colors"
              >
                {t('craftsmanship.exploreBtn')}
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}