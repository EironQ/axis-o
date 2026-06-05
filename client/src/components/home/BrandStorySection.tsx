import { Link } from 'react-router-dom'
import { Leaf, Scissors, Shield, Globe } from 'lucide-react'
import { useTranslation, useLanguage } from '@/i18n'
import { homeImages } from '@/assets/images'

const getFeatures = (t: (key: any) => string) => [
  {
    icon: Leaf,
    title: t('home.brandFeatures.ecoLeather'),
    desc: t('home.brandFeatures.ecoLeatherDesc'),
  },
  {
    icon: Scissors,
    title: t('home.brandFeatures.italianCraft'),
    desc: t('home.brandFeatures.italianCraftDesc'),
  },
  {
    icon: Shield,
    title: t('home.brandFeatures.lifetimeWarranty'),
    desc: t('home.brandFeatures.lifetimeWarrantyDesc'),
  },
  {
    icon: Globe,
    title: t('home.brandFeatures.globalSourcing'),
    desc: t('home.brandFeatures.globalSourcingDesc'),
  },
]

export default function BrandStorySection() {
  const { t } = useTranslation()
  const { lang } = useLanguage()
  const features = getFeatures(t)

  return (
    <section className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('home.brandPhilosophy')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              {t('home.designTimeless')}
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-10">
              {t('home.brandDesc')}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-3">
                  <feature.icon
                    size={20}
                    className="text-[#C89460] mt-0.5 flex-shrink-0"
                  />
                  <div>
                    <h4 className="text-sm font-medium text-[#3C2415] mb-1">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-[#3C2415]/50 leading-relaxed">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              to={`/${lang}/about`}
              className="inline-flex items-center gap-2 border-b border-[#3C2415]/30 pb-2 text-sm tracking-widest uppercase text-[#3C2415] hover:text-[#C89460] hover:border-[#C89460] transition-colors"
            >
              {t('home.learnMore')}
            </Link>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src={homeImages.brandStory}
                alt="Craftsmanship"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#C89460]/10 hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  )
}
