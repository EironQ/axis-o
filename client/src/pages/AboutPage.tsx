import { Ruler, RotateCcw, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useLanguage } from '@/i18n'
import SEO from '@/components/SEO'

function useAboutTranslation() {
  const { lang } = useLanguage()
  const t = (text: { zh: string; en: string }) => text[lang] || text.en
  return { lang, t }
}

interface BilingualString {
  zh: string
  en: string
}

interface TimelineItem {
  year: string
  location: BilingualString
  title: BilingualString
  paragraphs: BilingualString[]
  features?: BilingualString[]
  extraParagraphs?: BilingualString[]
  materials?: { label: BilingualString; value: BilingualString }[]
  quote?: BilingualString
  extraQuote?: { text: BilingualString; author: BilingualString }
  image: string
  tag: BilingualString
}

const timeline: TimelineItem[] = [
  {
    year: '2012',
    location: { zh: '中国 · 广州', en: 'Guangzhou, China' },
    title: { zh: '一间工作室，一个"轴心"的诞生', en: 'A Studio, The Birth of an "Axis"' },
    paragraphs: [
      {
        zh: '品牌创始人Kei Lin（林启）是一名工业产品设计师，曾参与过户外装备和行李箱的产品开发。他每天通勤时发现一个矛盾：市面上的包要么"耐用但丑"，要么"好看但一季就坏"。',
        en: 'Brand founder Kei Lin is an industrial product designer who previously worked on outdoor gear and luggage. During his daily commute, he noticed a contradiction: bags on the market were either "durable but ugly" or "pretty but fall apart in a season."'
      },
      {
        zh: '他在一张A3纸上画下第一个草图——不是包的外观，而是一个截面图。他在中间画了一条虚线，旁边写了一行字："好包的轴心不是材料，是秩序。"',
        en: 'He sketched his first design on an A3 sheet — not the bag\'s exterior, but a cross-section. He drew a dashed line down the middle and wrote: "The axis of a great bag isn\'t material — it\'s order."'
      },
      {
        zh: '这一年底，他在广州城中村租下一间不到30平的工作室，开始自己打版、踩缝纫机、测试五金。前两年只做了7只包，全部送人测试，不卖。',
        en: 'By year\'s end, he rented a studio under 30 square meters in a Guangzhou village, where he began pattern-making, sewing, and testing hardware himself. In the first two years, he made only 7 bags — all given away for testing, never sold.'
      },
    ],
    quote: { zh: '在没有标准的地方，建立自己的标准。', en: 'Where there are no standards, create your own.' },
    image: '/images/about/1.jpg',
    tag: { zh: '匠心的定义', en: 'Defining Craftsmanship' },
  },
  {
    year: '2015',
    location: { zh: '中国 · 广州', en: 'Guangzhou, China' },
    title: { zh: '第一款"可上市的失败"', en: 'The First "Marketable Failure"' },
    paragraphs: [
      {
        zh: 'AXIS O做了第一批量产样品——200只极简双肩包。上架测试前，Kei发现一个问题：肩带调节扣在连续使用300次后会轻微松动。',
        en: 'AXIS O produced its first batch of samples — 200 minimalist backpacks. Before launch, Kei discovered an issue: the strap adjuster would loosen slightly after 300 cycles of use.'
      },
      {
        zh: '这其实不影响正常使用，大部分品牌不会管。但他决定：全部拆解，重新设计五金模具。',
        en: 'It didn\'t affect normal use, and most brands wouldn\'t have cared. But he decided: disassemble everything, redesign the hardware mold.'
      },
      {
        zh: '这200只包最终只卖出了30只（送给第一批内测用户）。成本损失近10万元，但Kei在工作室黑板上写了一句话，至今还挂着。',
        en: 'Only 30 of those 200 bags were sold (given to the first beta testers). The loss was nearly 100,000 RMB, but Kei wrote a sentence on the studio blackboard that still hangs there today.'
      },
    ],
    quote: { zh: '瑕疵不分大小，只看能不能装作不知道。', en: 'A flaw is a flaw — the only question is whether you can pretend not to see it.' },
    image: '/images/about/2.jpg',
    tag: { zh: '面对瑕疵的选择', en: 'Confronting Imperfection' },
  },
  {
    year: '2018',
    location: { zh: '中国 · 广州', en: 'Guangzhou, China' },
    title: { zh: '"秩序系统"诞生', en: 'The "Order System" is Born' },
    paragraphs: [
      {
        zh: '经过三年反复测试，AXIS O推出品牌第一个完整系列"Axis System"。核心卖点不是外观，而是一套内部逻辑：',
        en: 'After three years of rigorous testing, AXIS O launched its first complete collection, the "Axis System." The core appeal wasn\'t the look — it was the internal logic:'
      },
    ],
    features: [
      { zh: '3 Zone 分区法则：工作区（电脑/文件）｜生活区（水杯/雨伞）｜快取区（钥匙/卡包）', en: '3-Zone System: Work (laptop/documents) | Live (water bottle/umbrella) | Quick-access (keys/cardholder)' },
      { zh: '模块化内胆：可拆卸隔层，一个包适应通勤、出差、短途旅行', en: 'Modular interior: removable compartments, one bag for commute, business trips, and weekend getaways' },
      { zh: '全开口设计：打开后像一本书，任何物品"不沉底"', en: 'Full-open design: opens like a book so nothing gets "lost at the bottom"' },
    ],
    extraParagraphs: [
      {
        zh: '第一批真正意义上的付费用户反馈里，出现频率最高的一句话是："我终于知道我的东西在哪里了。"',
        en: 'The most frequent feedback from the first real paying customers: "I finally know where my things are."'
      },
      {
        zh: '这一年，AXIS O全年销量1200只，零广告，全部靠口碑。',
        en: 'That year, AXIS O sold 1,200 units — zero advertising, all word-of-mouth.'
      },
    ],
    image: '/images/about/3.jpg',
    tag: { zh: '从一只包到一个体系', en: 'From a Bag to a System' },
  },
  {
    year: '2020',
    location: { zh: '中国 · 广州', en: 'Guangzhou, China' },
    title: { zh: '环保不是口号，是工程问题', en: 'Sustainability is Engineering, Not a Slogan' },
    paragraphs: [
      {
        zh: 'AXIS O正式启动"Material Trace"材料溯源计划：',
        en: 'AXIS O launched the "Material Trace" program:'
      },
    ],
    materials: [
      { label: { zh: '主面料', en: 'Main Fabric' }, value: { zh: '100% 回收PET（每只包≈28个塑料瓶）', en: '100% recycled PET (~28 plastic bottles per bag)' } },
      { label: { zh: '内衬', en: 'Lining' }, value: { zh: '废弃渔网再生尼龙', en: 'Recycled fishing net nylon' } },
      { label: { zh: '拉链', en: 'Zippers' }, value: { zh: '无氟防水涂层（不含PFC，不污染地下水）', en: 'PFC-free water-resistant coating' } },
    ],
    extraParagraphs: [
      {
        zh: '同年推出"旧包重生2.0"（不是1.0，因为前面失败过一次）——用户寄回任何品牌的旧包，AXIS O拆解后制成模块内胆或收纳配件，不可回收的部分承诺填埋量< 5%。',
        en: 'That year, we launched "Reborn 2.0" (not 1.0 — the first attempt failed) — customers send us any old bag, AXIS O dismantles it into modular inserts or accessories. Non-recyclable parts are kept under 5% landfill.'
      },
    ],
    quote: { zh: '匠心的延伸：好东西不应该被扔掉，也不应该让地球来承担"扔掉"的代价。', en: 'The extension of craftsmanship: good things shouldn\'t be thrown away, and the Earth shouldn\'t bear the cost.' },
    image: '/images/about/4.jpg',
    tag: { zh: '可持续的工程实践', en: 'Sustainable Engineering' },
  },
  {
    year: '2023',
    location: { zh: '北美 · 日本', en: 'North America · Japan' },
    title: { zh: '真正的转折点', en: 'The Real Turning Point' },
    paragraphs: [
      {
        zh: '不是因为变大，而是因为不变。',
        en: 'Not because we grew bigger, but because we stayed the same.'
      },
      {
        zh: 'AXIS O进入北美和日本市场。在没有任何营销投放的情况下，日本某生活方式买手店主动联系进货，理由写在一封简短的邮件里："我们测试了你们的包，开合5000次，没有异常。我们喜欢这种不说话的品质。"',
        en: 'AXIS O entered North American and Japanese markets. Without any marketing spend, a Japanese lifestyle boutique reached out to stock our bags. Their reason, in a short email: "We tested your bags — 5,000 open-close cycles, no issues. We like this quiet quality."'
      },
      {
        zh: '这一年，品牌全年销量突破5万只，退货率0.9%。',
        en: 'That year, annual sales exceeded 50,000 units with a return rate of 0.9%.'
      },
    ],
    extraQuote: {
      text: { zh: '我们不是没有机会做快一点、卖多一点。我们只是选择不做。', en: 'It\'s not that we never had the chance to go faster or sell more. We simply chose not to.' },
      author: { zh: 'Kei · 年度内部信', en: 'Kei · Annual Internal Letter' },
    },
    image: '/images/about/5.jpg',
    tag: { zh: '不说话的品质', en: 'Quiet Quality' },
  },
]

const todayPrinciples = [
  {
    icon: RotateCcw,
    title: { zh: '500次耐磨测试', en: '500 Abrasion Tests' },
    desc: { zh: '每一批面料先做500次耐磨测试，不打折才上线', en: 'Every fabric batch passes 500 abrasion tests before production' },
  },
  {
    icon: Users,
    title: { zh: '200人内测', en: '200 Beta Testers' },
    desc: { zh: '每一款新品上市前经过至少200人内测，不是KOL，是真用户', en: 'Every new product is tested by 200+ real users — not KOLs, real users' },
  },
  {
    icon: Ruler,
    title: { zh: '不问原因', en: 'No-Questions-Asked' },
    desc: { zh: '售后不问原因，只问"怎么让你满意"', en: 'After-sales: we don\'t ask why, only "how to make it right"' },
  },
]

export default function AboutPage() {
  const { t, lang } = useAboutTranslation()

  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <SEO title={t({ zh: 'AXIS O 品牌故事', en: 'AXIS O Brand Story' })} description={t({ zh: '十年匠心，一只好包的轴心', en: 'A decade of craftsmanship, the axis of a great bag' })} />
      <div className="pt-28 pb-20 md:pb-28 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8 text-center">
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-6">
            {lang === 'zh' ? '关于 AXIS O' : 'About AXIS O'}
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-6xl lg:text-7xl text-[#3C2415] mb-4 leading-tight tracking-tight">
            AXIS O
          </h1>
          <p className="font-['Playfair_Display'] text-xl md:text-2xl text-[#3C2415]/80 mb-6 italic">
            {lang === 'zh' ? '找到一只包的"中轴线"' : 'Finding the "Axis" of a Bag'}
          </p>
          <p className="text-[#3C2415]/50 max-w-xl mx-auto leading-relaxed text-sm tracking-wide">
            {lang === 'zh' ? '十年思考，五年打磨，只为那个刚刚好的平衡' : 'Ten years of thought, five years of refinement, for that perfect balance.'}
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
                        alt={t(item.title)}
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
                    {t(item.location)}
                  </p>
                  <h2 className="font-['Playfair_Display'] text-2xl md:text-3xl text-[#3C2415] mb-6 leading-snug">
                    {t(item.title)}
                  </h2>

                  {item.tag && (
                    <span className="inline-block text-[10px] tracking-[0.2em] uppercase text-[#C89460] border border-[#C89460]/30 px-3 py-1 mb-6">
                      {t(item.tag)}
                    </span>
                  )}

                  <div className="space-y-4">
                    {item.paragraphs.map((p, idx) => (
                      <p key={idx} className="text-sm text-[#3C2415]/70 leading-relaxed">
                        {t(p)}
                      </p>
                    ))}

                    {item.features && (
                      <ul className="space-y-2 py-2">
                        {item.features.map((f, idx) => (
                          <li key={idx} className="text-sm text-[#3C2415]/80 flex gap-3">
                            <span className="text-[#C89460] mt-1 flex-shrink-0">—</span>
                            <span>{t(f)}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {item.materials && (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
                        {item.materials.map((m, idx) => (
                          <div key={idx} className="bg-white/60 border border-[#3C2415]/5 px-4 py-3">
                            <p className="text-[10px] tracking-widest uppercase text-[#C89460] mb-1">
                              {t(m.label)}
                            </p>
                            <p className="text-xs text-[#3C2415]/70 leading-relaxed">
                              {t(m.value)}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {item.extraParagraphs?.map((p, idx) => (
                      <p key={`extra-${idx}`} className="text-sm text-[#3C2415]/70 leading-relaxed">
                        {t(p)}
                      </p>
                    ))}
                  </div>

                  {item.quote && (
                    <div className="mt-6 pl-5 border-l-2 border-[#C89460]/40">
                      <p className="text-sm text-[#3C2415]/80 italic leading-relaxed">
                        {t(item.quote)}
                      </p>
                    </div>
                  )}

                  {item.extraQuote && (
                    <div className="mt-6 pl-5 border-l-2 border-[#C89460]/40">
                      <p className="text-sm text-[#3C2415]/80 italic leading-relaxed">
                        "{t(item.extraQuote.text)}"
                      </p>
                      <p className="text-xs text-[#3C2415]/40 mt-2">
                        — {t(item.extraQuote.author)}
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
                {lang === 'zh' ? '今天 · AXIS O' : 'Today · AXIS O'}
              </span>
            </div>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-4xl text-[#FAF7F2] text-center mb-4">
              {lang === 'zh' ? '匠心不是慢，是每一步都算数' : 'Craftsmanship isn\'t slowness — it\'s making every step count'}
            </h2>
            <p className="text-[#FAF7F2]/50 text-sm text-center max-w-lg mx-auto mb-16 leading-relaxed">
              {lang === 'zh' ? '现在的AXIS O仍然保留三条规定' : 'AXIS O still lives by three principles'}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {todayPrinciples.map((principle) => (
                <div key={t(principle.title)} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-[#C89460]/10 flex items-center justify-center mb-5">
                    <principle.icon size={22} className="text-[#C89460]" />
                  </div>
                  <h3 className="text-sm tracking-wider text-[#FAF7F2] mb-3 uppercase">
                    {t(principle.title)}
                  </h3>
                  <p className="text-sm text-[#FAF7F2]/50 leading-relaxed">
                    {t(principle.desc)}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-16 max-w-xl mx-auto text-center border-t border-[#FAF7F2]/10 pt-12">
              <p className="text-[#FAF7F2]/60 text-sm italic leading-relaxed mb-2">
                {lang === 'zh' ? '我们不相信完美，因为完美是静止的。' : 'We don\'t believe in perfection — perfection is static.'}
              </p>
              <p className="text-[#FAF7F2]/60 text-sm italic leading-relaxed">
                {lang === 'zh' ? '我们相信：每一只包都值得比上一只好一点点。' : 'We believe: every bag deserves to be a little better than the last.'}
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
                {lang === 'zh' ? '找到轴心，秩序自生。' : 'Find your axis. Order follows.'}
              </p>
              <Link
                to={`/${lang}/products`}
                className="inline-flex items-center gap-2 border border-[#3C2415]/30 px-8 py-3 text-xs tracking-[0.2em] uppercase text-[#3C2415] hover:bg-[#3C2415] hover:text-[#FAF7F2] transition-all duration-300"
              >
                {lang === 'zh' ? '探索产品' : 'Explore Products'}
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
