import { Feather, LayoutGrid, Repeat } from 'lucide-react'

const features = [
  {
    icon: Feather,
    title: 'Featherlight',
    desc: 'Weighs less than 3 eggs (approx. 200g).',
  },
  {
    icon: LayoutGrid,
    title: 'Smart Pockets',
    desc: '8 organized compartments for 15" laptop & water bottle.',
  },
  {
    icon: Repeat,
    title: 'Hands-Free Friendly',
    desc: 'Converts from tote to crossbody in 1 second.',
  },
]

export default function PracticalSection() {
  return (
    <section className="py-24 md:py-32 bg-white">
      <div className="mx-auto max-w-[1440px] px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="order-2 lg:order-1">
            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
              人性化设计
            </p>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#3C2415] mb-6 leading-tight">
              Your Daily Life, <br />Simplified.
            </h2>
            <p className="text-[#3C2415]/70 leading-relaxed mb-8">
              Tired of digging through a black hole to find your keys?
              Meet our "Open-Flat" design. The wide opening lets you see
              everything at a glance. Plus, the padded shoulder strap
              protects your shoulder even on heavy grocery days.
            </p>

            <div className="space-y-4 mb-10">
              {features.map((feature) => (
                <div key={feature.title} className="flex gap-4 items-start">
                  <div className="w-10 h-10 rounded-full bg-[#C89460]/10 flex items-center justify-center flex-shrink-0">
                    <feature.icon size={18} className="text-[#C89460]" />
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

            <p className="text-xs tracking-[0.3em] uppercase text-[#C89460]">
              👜 让日常生活更简单。平开式设计，加厚肩带，轻松应对每一天。
            </p>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="aspect-[4/5] bg-[#F5F0E8] overflow-hidden">
              <img
                src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=woman%20effortlessly%20taking%20laptop%20out%20of%20spacious%20tote%20bag%20with%20wide%20opening%2C%20organized%20interior%20compartments%20visible%2C%20bright%20clean%20lifestyle%20shot%2C%20minimalist%20modern%20aesthetic%2C%20functional%20fashion&image_size=portrait_4_3"
                alt="便捷收纳展示"
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
