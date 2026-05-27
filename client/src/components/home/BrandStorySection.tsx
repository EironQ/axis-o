import { Link } from 'react-router-dom'
import { Leaf, Scissors, Shield, Globe } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: '环保植鞣皮革',
    desc: '采用植物鞣制工艺，减少化学物质使用，对环境更友好。',
  },
  {
    icon: Scissors,
    title: '意大利手工制造',
    desc: '每一只包都由经验丰富的意大利工匠精心制作，细节可见。',
  },
  {
    icon: Shield,
    title: '终身保修服务',
    desc: '我们对每一件产品充满信心，提供终身质量保障服务。',
  },
  {
    icon: Globe,
    title: '全球可持续采购',
    desc: '从原材料到包装，我们坚持负责任的供应链管理。',
  },
]

export default function BrandStorySection() {
  return (
    <section className="py-24 md:py-32 bg-[#FAF7F2]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=artisan%20leather%20craftsman%20working%20on%20luxury%20handbag%20in%20Italian%20workshop%2C%20warm%20natural%20light%2C%20authentic%20craftsmanship%2C%20leather%20tools%20and%20materials%2C%20documentary%20style%20photography%2C%20earthy%20warm%20tones&image_size=portrait_4_3"
                alt="工艺展示"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#C89460]/10 hidden lg:block" />
          </div>

          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              品牌理念
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              设计出历久弥新的<br />产品
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-10">
              我们是一个热爱设计的品牌。从2018年的第一款托特包开始，
              我们始终坚持一个信念——简约的设计才能经得起时间的考验。
              减少不必要的装饰，专注于材质、比例与功能，
              让每一只包都成为您日常生活中的优雅伴侣。
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
              to="/about"
              className="inline-flex items-center gap-2 border-b border-[#3C2415]/30 pb-2 text-sm tracking-widest uppercase text-[#3C2415] hover:text-[#C89460] hover:border-[#C89460] transition-colors"
            >
              了解更多
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
