import { Product } from '@/services/api'
import { useSettings } from '@/context/SettingsContext'

interface ProductDescriptionProps {
  product: Product
}

export default function ProductDescription({ product }: ProductDescriptionProps) {
  const { store } = useSettings()
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
            产品故事
          </h3>
          <p className="text-[#3C2415]/70 leading-relaxed text-lg font-['Playfair_Display']">
            {product.story || `探索 ${store.store_name} 的匠心工艺`}
          </p>
        </div>
        <div>
          <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-6">
            详细参数
          </h3>
          <dl className="space-y-4">
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">材质</dt>
              <dd className="text-sm text-[#3C2415]">{product.material}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">可选尺寸</dt>
              <dd className="text-sm text-[#3C2415]">{getUniqueSizes()}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">可选颜色</dt>
              <dd className="text-sm text-[#3C2415]">{getUniqueColors()}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">产地</dt>
              <dd className="text-sm text-[#3C2415]">意大利</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-[#3C2415]/5">
              <dt className="text-sm text-[#3C2415]/50">系列</dt>
              <dd className="text-sm text-[#3C2415]">
                {product.series === 'classic' ? '经典系列' : product.series === 'luxe' ? '轻奢系列' : '旅行系列'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-12 bg-[#F5F0E8] p-8 md:p-12">
        <h3 className="text-xs tracking-[0.2em] uppercase text-[#C89460] mb-3">
          保养建议
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">避免潮湿</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">请避免将产品暴露在雨水或潮湿环境中。如不慎沾水，请用柔软干布轻轻擦拭。</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">定期护理</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">建议每3个月使用专业皮革护理产品进行保养，以保持皮革的柔软与光泽。</p>
          </div>
          <div>
            <h4 className="text-sm font-medium text-[#3C2415] mb-2">正确存放</h4>
            <p className="text-xs text-[#3C2415]/50 leading-relaxed">不使用时，请将产品放入防尘袋中，存放于阴凉干燥处，避免阳光直射。</p>
          </div>
        </div>
      </div>
    </div>
  )
}
