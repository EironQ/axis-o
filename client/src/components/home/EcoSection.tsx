import { Leaf, Globe, Recycle } from 'lucide-react'
import { useTranslation } from '@/i18n'
import { homeImages } from '@/assets/images'

const features = [
  {
    icon: Leaf,
    key: 'ecoMaterials',
  },
  {
    icon: Globe,
    key: 'lowCarbon',
  },
  {
    icon: Recycle,
    key: 'zeroWaste',
  },
]

export default function EcoSection() {
  const { t } = useTranslation()

  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              {t('home.ecoCommitment')}
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              {t('home.wearYourValues')}
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-8">
              {t('home.ecoStory')}
            </p>

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div key={feature.key} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#6B705C]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={18} className="text-[#6B705C]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#3C2415]">
                      {feature.key === 'ecoMaterials' ? t('home.ecoMaterialsTitle') : feature.key === 'lowCarbon' ? t('home.lowCarbonTitle') : t('home.zeroWasteTitle')}
                    </h4>
                    <p className="text-xs text-[#3C2415]/50">
                      {feature.key === 'ecoMaterials' ? t('home.ecoMaterialsDesc') : feature.key === 'lowCarbon' ? t('home.lowCarbonDesc') : t('home.zeroWasteDesc')}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C]">
              {t('home.ecoDesc')}
            </p>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src={homeImages.eco}
                alt="Eco materials"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -left-6 w-48 h-48 bg-[#6B705C]/10 hidden lg:block" />
          </div>
        </div>
      </div>
    </section>
  )
}
