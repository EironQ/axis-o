import { Shield, Gem, Scissors } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { homeImages } from '@/assets/images'

const features = [
  {
    icon: Shield,
    key: 'builtToLast',
  },
  {
    icon: Gem,
    key: 'premiumHardware',
  },
  {
    icon: Scissors,
    key: 'reinforcedStitching',
  },
]

export default function QualitySection() {
  const { t } = useTranslation()

  return (
    <section className="py-24 md:py-32 bg-[#F5F0E8]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] bg-[#E8DED0] overflow-hidden">
              <img
                src={homeImages.quality}
                alt="Hardware detail"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#C89460]/10 hidden lg:block" />
          </div>

          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('home.qualityGuarantee')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight" dangerouslySetInnerHTML={{ __html: t('home.agesGracefully') }} />
            <p className="text-[#3C2415]/70 leading-relaxed mb-8" dangerouslySetInnerHTML={{ __html: t('home.qualityDesc') }} />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {features.map((feature) => (
                <div key={feature.key} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#C89460]/10 flex items-center justify-center mb-3">
                    <feature.icon size={20} className="text-[#C89460]" />
                  </div>
                  <h4 className="text-sm font-medium text-[#3C2415] mb-1">
                    {feature.key === 'builtToLast' ? t('home.builtToLastTitle') : feature.key === 'premiumHardware' ? t('home.premiumHardwareTitle') : t('home.reinforcedStitchingTitle')}
                  </h4>
                  <p className="text-xs text-[#3C2415]/50 leading-relaxed">
                    {feature.key === 'builtToLast' ? t('home.builtToLastDesc') : feature.key === 'premiumHardware' ? t('home.premiumHardwareDesc') : t('home.reinforcedStitchingDesc')}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460]">
              {t('home.betterWithAgeDesc')}
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
