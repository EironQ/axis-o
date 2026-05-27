import { Leaf, Globe, Recycle } from 'lucide-react'

const features = [
  {
    icon: Leaf,
    title: 'Eco-Friendly Materials',
    desc: 'Crafted from recycled fabrics & vegan leather.',
  },
  {
    icon: Globe,
    title: 'Low Carbon Footprint',
    desc: 'Love fashion, respect the planet.',
  },
  {
    icon: Recycle,
    title: 'Zero Waste Packaging',
    desc: '100% recyclable shipping boxes included.',
  },
]

export default function EcoSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              环保承诺
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              Wear Your Values.
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-8">
              Every stitch tells a green story. Our bags are made from
              post-consumer recycled PET and certified vegan materials.
              By choosing us, you're not just buying a bag—you're keeping
              15 plastic bottles out of the ocean.
            </p>

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#6B705C]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={18} className="text-[#6B705C]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-[#3C2415]">
                      {feature.title}
                    </h4>
                    <p className="text-xs text-[#3C2415]/50">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-xs tracking-[0.3em] uppercase text-[#6B705C]">
              💚 穿着你的价值观。每一针都在讲述绿色的故事。
            </p>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=elegant%20handbag%20surrounded%20by%20green%20plants%20and%20natural%20materials%2C%20cream%20and%20sage%20green%20color%20palette%2C%20soft%20natural%20lighting%2C%20eco%20friendly%20fashion%20lifestyle%2C%20minimalist%20aesthetic%2C%20sustainable%20luxury&image_size=portrait_4_3"
                alt="环保材质展示"
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
