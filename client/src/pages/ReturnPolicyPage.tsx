import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const sections = [
  {
    title: '一、退货条件',
    subsections: [
      {
        title: '1.1 七天无理由退货',
        content: '自签收之日起 7 天内，在满足以下条件的情况下，您可以无理由退货：',
        items: [
          '商品未使用、未洗涤、未磨损；',
          '商品及配件（防尘袋、吊牌、说明书、赠品等）完好齐全；',
          '商品包装完好，不影响二次销售；',
          '非定制商品。',
        ],
      },
      {
        title: '1.2 质量问题退货',
        content: '如商品存在质量问题（如开裂、脱胶、五金件损坏等），请于签收后 15 天内联系我们办理退货，不受无理由退货条件限制。',
      },
      {
        title: '1.3 发货错误',
        content: '如收到商品与订单不符，请于签收后 7 天内联系我们，我们将免费为您更换并承担往返运费。',
      },
    ],
  },
  {
    title: '二、不予退换的情况',
    items: [
      '超过退换货期限；',
      '商品已使用、洗涤或有明显人为损坏；',
      '吊牌已剪除或防尘袋缺失；',
      '非质量问题且已影响二次销售；',
      '定制商品（因个性化定制无法二次销售）；',
      '特价/清仓商品（页面已标注不可退换的）；',
      '赠品（不单独退换）。',
    ],
  },
  {
    title: '三、退换货流程',
    subsections: [
      {
        title: '3.1 申请退换',
        items: [
          '登录账户，进入"我的订单"，找到需要退换的订单；',
          '点击"申请退换"，填写退换原因并上传相关照片；',
          '提交申请，等待审核（1-2个工作日）。',
        ],
      },
      {
        title: '3.2 审核通过',
        items: [
          '审核通过后，您将收到退货地址和退货码；',
          '请将商品妥善包装，连同退货码一同寄回；',
          '退货快递建议选择有物流追踪的服务，并保留快递单号。',
        ],
      },
      {
        title: '3.3 退款处理',
        items: [
          '我们收到退回商品后将进行验收（1-3个工作日）；',
          '验收通过后，退款将原路返回至您的支付账户；',
          '退款到账时间取决于您的支付方式，一般为 3-10 个工作日。',
        ],
      },
    ],
  },
  {
    title: '四、运费说明',
    type: 'table',
    headers: ['退换原因', '退货运费承担', '换货运费承担'],
    rows: [
      ['七天无理由退货', '买家承担', '买家承担'],
      ['商品质量问题', '卖家承担', '卖家承担'],
      ['发货错误', '卖家承担', '卖家承担'],
    ],
  },
  {
    title: '五、换货说明',
    items: [
      '换货仅支持同款商品不同颜色/尺寸的调换（如有库存）。',
      '如需更换为其他款式，请先办理退货后重新下单。',
      '换货商品将以您申请换货时的价格为准，如价格有变动，按实际价格结算差价。',
    ],
  },
  {
    title: '六、特殊说明',
    subsections: [
      {
        title: '6.1 降价保护',
        content: '如您在签收后 7 天内发现同款商品降价，可联系我们申请差价退还。',
      },
      {
        title: '6.2 维修服务',
        content: '商品在正常使用情况下出现质量问题，自购买之日起 30 天内可享受免费维修服务（非人为损坏）。',
      },
      {
        title: '6.3 保修范围',
        content: '五金件氧化变色、皮质自然老化、正常使用磨损等不属于保修范围。',
      },
    ],
  },
  {
    title: '七、联系方式',
    type: 'contact',
    items: [
      '电子邮件：[请填写您的邮箱]',
      '客服电话：[请填写您的客服电话]',
      '在线客服时间：工作日 9:00-18:00',
    ],
    content: '我们承诺在收到您的退换货申请后 1-2 个工作日内给予回复，竭诚为您服务。',
  },
]

export default function ReturnPolicyPage() {
  return (
    <main className="min-h-screen bg-[#FAF7F2]">
      <div className="pt-28 pb-16 md:pb-24 bg-[#F5F0E8]">
        <div className="mx-auto max-w-[1440px] px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[#3C2415]/50 hover:text-[#C89460] transition-colors mb-8"
          >
            <ArrowLeft size={14} />
            返回首页
          </Link>
          <p className="text-xs tracking-[0.3em] uppercase text-[#C89460] mb-4">
            退换政策
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl text-[#3C2415] mb-4 leading-tight">
            退换政策
          </h1>
          <p className="text-sm text-[#3C2415]/50">
            最后更新日期：2026年5月26日
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-12">
            我们希望您对每一次购物都感到满意。如因各种原因您需要退换货，请仔细阅读以下政策。
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-6">
                  {section.title}
                </h2>

                {section.type === 'table' && (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-[#3C2415]/10">
                          {section.headers.map((header) => (
                            <th key={header} className="text-left py-3 px-4 text-[#3C2415] font-semibold text-xs tracking-[0.1em] uppercase">
                              {header}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {section.rows.map((row, idx) => (
                          <tr key={idx} className="border-b border-[#3C2415]/5">
                            {row.map((cell) => (
                              <td key={cell} className="py-3 px-4 text-[#3C2415]/70">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {section.type === 'contact' && (
                  <div className="p-6 bg-[#F5F0E8] rounded-sm">
                    <ul className="space-y-2 mb-3">
                      {section.items.map((item) => (
                        <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                    {section.content && (
                      <p className="text-sm text-[#3C2415]/50 leading-relaxed">
                        {section.content}
                      </p>
                    )}
                  </div>
                )}

                {section.items && section.type !== 'table' && section.type !== 'contact' && (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed pl-5 relative">
                        <span className="absolute left-0 top-0 text-[#C89460]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.subsections && (
                  <div className="space-y-6">
                    {section.subsections.map((sub) => (
                      <div key={sub.title}>
                        <h3 className="text-sm font-semibold text-[#3C2415] mb-3">
                          {sub.title}
                        </h3>
                        {sub.content && (
                          <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-2">
                            {sub.content}
                          </p>
                        )}
                        {sub.items && (
                          <ul className="space-y-1">
                            {sub.items.map((item) => (
                              <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed pl-5 relative">
                                <span className="absolute left-0 top-0 text-[#C89460]">•</span>
                                {item}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {!section.subsections && !section.items && section.content && (
                  <p className="text-sm text-[#3C2415]/70 leading-relaxed">
                    {section.content}
                  </p>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
