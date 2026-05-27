import { Ruler, RotateCcw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'

const timeline = [
  {
    year: '2012',
    location: '中国 · 广州',
    title: '一间工作室，一个"轴心"的诞生',
    paragraphs: [
      '品牌创始人Kei Lin（林启）是一名工业产品设计师，曾参与过户外装备和行李箱的产品开发。他每天通勤时发现一个矛盾：市面上的包要么"耐用但丑"，要么"好看但一季就坏"。',
      '他在一张A3纸上画下第一个草图——不是包的外观，而是一个截面图。他在中间画了一条虚线，旁边写了一行字："好包的轴心不是材料，是秩序。"',
      '这一年底，他在广州城中村租下一间不到30平的工作室，开始自己打版、踩缝纫机、测试五金。前两年只做了7只包，全部送人测试，不卖。',
    ],
    quote: '在没有标准的地方，建立自己的标准。',
    image:
      'https://images.pexels.com/photos/7147661/pexels-photo-7147661.jpeg?auto=compress&cs=tinysrgb&w=600',
    tag: '匠心的定义',
  },
  {
    year: '2015',
    location: '中国 · 广州',
    title: '第一款"可上市的失败"',
    paragraphs: [
      'AXIS O做了第一批量产样品——200只极简双肩包。上架测试前，Kei发现一个问题：肩带调节扣在连续使用300次后会轻微松动。',
      '这其实不影响正常使用，大部分品牌不会管。但他决定：全部拆解，重新设计五金模具。',
      '这200只包最终只卖出了30只（送给第一批内测用户）。成本损失近10万元，但Kei在工作室黑板上写了一句话，至今还挂着。',
    ],
    quote: '瑕疵不分大小，只看能不能装作不知道。',
    image:
      'https://images.pexels.com/photos/1206258/pexels-photo-1206258.jpeg?auto=compress&cs=tinysrgb&w=600',
    tag: '面对瑕疵的选择',
  },
  {
    year: '2018',
    location: '中国 · 广州',
    title: '"秩序系统"诞生',
    paragraphs: [
      '经过三年反复测试，AXIS O推出品牌第一个完整系列"Axis System"。核心卖点不是外观，而是一套内部逻辑：',
    ],
    features: [
      '3 Zone 分区法则：工作区（电脑/文件）｜ 生活区（水杯/雨伞）｜ 快取区（钥匙/卡包）',
      '模块化内胆：可拆卸隔层，一个包适应通勤、出差、短途旅行',
      '全开口设计：打开后像一本书，任何物品"不沉底"',
    ],
    extraParagraphs: [
      '第一批真正意义上的付费用户反馈里，出现频率最高的一句话是："我终于知道我的东西在哪里了。"',
      '这一年，AXIS O全年销量1200只，零广告，全部靠口碑。',
    ],
    image:
      'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=600',
    tag: '从一只包到一个体系',
  },
  {
    year: '2020',
    location: '中国 · 广州',
    title: '环保不是口号，是工程问题',
    paragraphs: [
      'AXIS O正式启动"Material Trace"材料溯源计划：',
    ],
    materials: [
      { label: '主面料', value: '100% 回收PET（每只包≈28个塑料瓶）' },
      { label: '内衬', value: '废弃渔网再生尼龙' },
      { label: '拉链', value: '无氟防水涂层（不含PFC，不污染地下水）' },
    ],
    extraParagraphs: [
      '同年推出"旧包重生2.0"（不是1.0，因为前面失败过一次）——用户寄回任何品牌的旧包，AXIS O拆解后制成模块内胆或收纳配件，不可回收的部分承诺填埋量< 5%。',
    ],
    quote: '匠心的延伸：好东西不应该被扔掉，也不应该让地球来承担"扔掉"的代价。',
    image:
      'https://images.pexels.com/photos/4219654/pexels-photo-4219654.jpeg?auto=compress&cs=tinysrgb&w=600',
    tag: '可持续的工程实践',
  },
  {
    year: '2023',
    location: '北美 · 日本',
    title: '真正的转折点',
    paragraphs: [
      '不是因为变大，而是因为不变。',
      'AXIS O进入北美和日本市场。在没有任何营销投放的情况下，日本某生活方式买手店主动联系进货，理由写在一封简短的邮件里："我们测试了你们的包，开合5000次，没有异常。我们喜欢这种不说话的品质。"',
      '这一年，品牌全年销量突破5万只，退货率0.9%。',
    ],
    extraQuote: {
      text: '我们不是没有机会做快一点、卖多一点。我们只是选择不做。',
      author: 'Kei · 年度内部信',
    },
    image:
      'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=600',
    tag: '不说话的品质',
  },
]

const todayPrinciples = [
  {
    icon: RotateCcw,
    title: '500次耐磨测试',
    desc: '每一批面料先做500次耐磨测试，不打折才上线',
  },
  {
    icon: Users,
    title: '200人内测',
    desc: '每一款新品上市前经过至少200人内测，不是KOL，是真用户',
  },
  {
    icon: Ruler,
    title: '不问原因',
    desc: '售后不问原因，只问"怎么让你满意"',
  },
]

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-28 pb-20 md:pb-28 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-6">
            关于 AXIS O
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl lg:text-7xl text-[#3C2415] mb-4 leading-tight tracking-tight">
            AXIS O
          </h1>
          <p className="font-['Playfair_Display'] text-xl md:text-2xl text-[#3C2415]/80 mb-6 italic">
            找到一只包的"中轴线"
          </p>
          <p className="text-[#3C2415]/50 max-w-xl mx-auto leading-relaxed text-sm tracking-wide">
            十年思考，五年打磨，只为那个刚刚好的平衡
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#C89460]/10 hidden md:block" />

        {timeline.map((item, i) => (
          <section
            key={item.year}
            className="relative py-16 md:py-28"
          >
            <div className="mx-auto max-w-[1440px] px-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
                <div className={i % 2 === 1 ? 'md:order-2' : ''}>
                  <div className="relative group">
                    <div className="aspect-[4/3] bg-[#F5F0E8] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                      />
                    </div>
                    <div className="absolute -bottom-3 -right-3 w-24 h-24 bg-[#C89460]/5 hidden md:block" />
                  </div>
                </div>

                <div className={i % 2 === 1 ? 'md:order-1' : ''}>
                  <div className="flex items-center gap-4 mb-4">
                    <span className="font-['Playfair_Display'] text-6xl md:text-7xl text-[#C89460]/20 leading-none">
                      {item.year}
                    </span>
                    <span className="hidden md:block w-3 h-3 rounded-full bg-[#C89460] ring-4 ring-[#C89460]/10 flex-shrink-0" />
                  </div>

                  <p className="text-xs tracking-[0.3em] uppercase text-[#C89460]/70 mb-2">
                    {item.location}
                  </p>
                  <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl text-[#3C2415] mb-6 leading-snug">
                    {item.title}
                  </h2>

                  {item.tag && (
                    <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#C89460] border border-[#C89460]/30 px-3 py-1 mb-6">
                      {item.tag}
                    </span>
                  )}

                  <div className="space-y-4">
                    {item.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-sm text-[#3C2415]/70 leading-relaxed">
                        {p}
                      </p>
                    ))}

                    {item.features && (
                      <ul className="space-y-2 py-2">
                        {item.features.map((f, idx) => (
                          <li key={idx} className="text-sm text-[#3C2415]/80 flex gap-3">
                            <span className="text-[#C89460] mt-1 flex-shrink-0">—</span>
                            <span>{f}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.materials && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
                        {item.materials.map((m, idx) => (
                          <div key={idx} className="bg-white/60 border border-[#3C2415]/5 px-4 py-3">
                            <p className="text-[10px] tracking-widest uppercase text-[#C89460] mb-1">
                              {m.label}
                            </p>
                            <p className="text-xs text-[#3C2415]/70 leading-relaxed">
                              {m.value}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.extraParagraphs?.map((p, idx) => (
                      <p key={`extra-${idx}`} className="text-sm text-[#3C2415]/70 leading-relaxed">
                        {p}
                      </p>
                    ))}
                  </div>

                  {item.quote && (
                    <div className="mt-6 pl-5 border-l-2 border-[#C89460]/40">
                      <p className="text-sm text-[#3C2415]/80 italic leading-relaxed">
                        {item.quote}
                      </p>
                    </div>
                  )}

                  {item.extraQuote && (
                    <div className="mt-6 pl-5 border-l-2 border-[#C89460]/40">
                      <p className="text-sm text-[#3C2415]/80 italic leading-relaxed">
                        "{item.extraQuote.text}"
                      </p>
                      <p className="text-xs text-[#3C2415]/40 mt-2">
                        — {item.extraQuote.author}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>
        ))}

        <section className="py-20 md:py-28 bg-[#3C2415]">
          <div className="mx-auto max-w-[1440px] px-8">
            <div className="text-center mb-4">
              <span className="text-xs tracking-[0.3em] uppercase text-[#C89460]/80 mb-4 inline-block">
                今天 · AXIS O
              </span>
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#FAF7F2] text-center mb-4">
              匠心不是慢，是每一步都算数
            </h2>
            <p className="text-[#FAF7F2]/50 text-sm text-center max-w-lg mx-auto mb-16 leading-relaxed">
              现在的AXIS O仍然保留三条规定
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {todayPrinciples.map((principle) => (
                <div key={principle.title} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#C89460]/10 flex items-center justify-center mb-5">
                    <principle.icon size={22} className="text-[#C89460]" />
                  </div>
                  <h3 className="text-sm tracking-wider text-[#FAF7F2] mb-3 uppercase">
                    {principle.title}
                  </h3>
                  <p className="text-sm text-[#FAF7F2]/50 leading-relaxed">
                    {principle.desc}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 max-w-xl mx-auto text-center border-t border-[#FAF7F2]/10 pt-12">
              <p className="text-[#FAF7F2]/60 text-sm italic leading-relaxed mb-2">
                我们不相信完美，因为完美是静止的。
              </p>
              <p className="text-[#FAF7F2]/60 text-sm italic leading-relaxed">
                我们相信：每一只包都值得比上一只好一点点。
              </p>
            </div>
          </div>
        </section>

        <section className="py-20 md:py-28 bg-[#FAF7F2]">
          <div className="mx-auto max-w-[1440px] px-8 text-center">
            <div className="max-w-lg mx-auto">
              <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
                AXIS O
              </p>
              <p className="font-['Playfair_Display'] text-2xl md:text-3xl text-[#3C2415] mb-6 italic">
                找到轴心，秩序自生。
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-2 border border-[#3C2415]/30 px-8 py-3 text-xs tracking-[0.2em] uppercase text-[#3C2415] hover:bg-[#3C2415] hover:text-[#FAF7F2] transition-all duration-300"
              >
                探索产品
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
