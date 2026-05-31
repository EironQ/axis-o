import { Feather, LayoutGrid, Repeat } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { homeImages } from '@/assets/images'

const features = [
  {
    icon: Feather,
    key: 'featherlight',
  },
  {
    icon: LayoutGrid,
    key: 'smartPockets',
  },
  {
    icon: Repeat,
    key: 'handsFree',
  },
]

export default function PracticalSection() {
  const { t } = useTranslation()

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('home.userFriendly')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('home.dailyLifeSimplified') }} />
            <p className="text-[#3C2415]/70 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: t('home.dailyLifeDesc') }} />

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div key={feature.key} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#C89460]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={18} className="text-[#C89460]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#3C2415]">
                      {feature.key === 'featherlight' ? t('home.featherlightTitle') : feature.key === 'smartPockets' ? t('home.smartPocketsTitle') : t('home.handsFreeTitle')}
                    </h4>
                    <p className="text-xs text-[#3C2415]/50">
                      {feature.key === 'featherlight' ? t('home.featherlightDesc') : feature.key === 'smartPockets' ? t('home.smartPocketsDesc') : t('home.handsFreeDesc')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460]">
              {t('home.userFriendlyDesc')}
            </p>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src={homeImages.practical}
                alt="Convenient storage"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#C89460]/10 hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  )
}
