import { Product } from '@/services/api'
import { useSettings } from '@/context/SettingsContext'
import { useTranslation } from '@/i18n'

interface ProductDescriptionProps {
  product: Product
}

export default function ProductDescription({ product }: ProductDescriptionProps) {
  const { store } = useSettings()
  const { t } = useTranslation()

  const getUniqueColors = () => {
    const colors = new Set<string>()
    product.variants.forEach((variant) => colors.add(variant.colorName))
    return Array.from(colors).join(' / ')
  }

  const getUniqueSizes = () => {
    const sizes = new Set<string>()
    product.variants.forEach((variant) => sizes.add(variant.size))
    return Array.from(sizes).join(' / ')
  }

  return (
    <div className="mt-20 border-t border-[#3C2415]/10 pt-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-6">
            {t('product.productStory')}
          </h3>
          <p className="text-[#3C2415]/70 leading-relaxed text-lg font-['Playfair_Display']">
            {product.story || t('product.exploreCraftsmanship').replace('{name}', store.store_name)}
          </p>
        </div>
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-6">
            {t('product.specifications')}
          </h3>
          <dl className="space-y-4">
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">{t('product.material')}</dt>
              <dd className="text-sm text-[#3C2415]">{product.material}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">{t('product.availableSizes')}</dt>
              <dd className="text-sm text-[#3C2415]">{getUniqueSizes()}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">{t('product.availableColors')}</dt>
              <dd className="text-sm text-[#3C2415]">{getUniqueColors()}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">{t('product.size')}</dt>
              <dd className="text-sm text-[#3C2415]">{getUniqueSizes()}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">{t('product.series')}</dt>
              <dd className="text-sm text-[#3C2415]">
                {product.series === 'classic' ? t('product.classic') : product.series === 'luxe' ? t('product.luxe') : t('product.travel')}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-12 bg-[#F5F0E8] p-8 md:p-12">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-3">
          {t('product.careGuide')}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">{t('product.careAvoidMoisture')}</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">{t('product.careAvoidMoistureDesc')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">{t('product.careRegular')}</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">{t('product.careRegularDesc')}</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">{t('product.careStorage')}</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">{t('product.careStorageDesc')}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
