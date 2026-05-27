import { Shield, Gem, Scissors } from 'lucide-react'

const features = [
  {
    icon: Shield,
    title: 'Built to Last',
    desc: 'Scratch-resistant & water-repellent surface.',
  },
  {
    icon: Gem,
    title: 'Premium Hardware',
    desc: 'Rust-proof zippers that glide smoothly.',
  },
  {
    icon: Scissors,
    title: 'Reinforced Stitching',
    desc: 'Holds up to 30kg without tearing.',
  },
]

export default function QualitySection() {
  return (
    <section className="py-24 md:py-32 bg-[#F5F0E8]">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="aspect-[4/5] bg-[#E8DED0] overflow-hidden">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=macro%20photography%20of%20premium%20handbag%20hardware%20and%20stitching%20details%2C%20gold%20metal%20zipper%20teeth%20closeup%2C%20luxury%20craftsmanship%2C%20warm%20golden%20lighting%2C%20high%20end%20fashion%20accessory%20detail&image_size=portrait_4_3"
                alt="五金细节展示"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 w-48 h-48 bg-[#C89460]/10 hidden lg:block" />
          </div>

          <div>
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              品质保证
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              The Bag That <br />Ages Gracefully.
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-8">
              Cheap bags fall apart in a season. Ours get better.
              We use SGS-certified high-density nylon and Italian-grade
              microfiber leather. No loose threads, no fading colors.
              Just a reliable companion for your daily hustle.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              {features.map((feature) => (
                <div key={feature.title} className="text-center">
                  <div className="w-12 h-12 mx-auto rounded-full bg-[#C89460]/10 flex items-center justify-center mb-3">
                    <feature.icon size={20} className="text-[#C89460]" />
                  </div>
                  <h4 className="text-sm font-medium text-[#3C2415] mb-1">
                    {feature.title}
                  </h4>
                  <p className="text-xs text-[#3C2415]/50 leading-relaxed">
                    {feature.desc}
                  </p>
                </div>
              ))}
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460]">
              💎 越用越好看的包。意式工艺超纤皮，是你日常奋斗中的可靠伙伴。
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
