import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const sections = [
  {
    title: '一、配送范围',
    items: [
      '我们目前支持全国配送（港澳台地区及偏远地区可能存在限制，以下单时系统提示为准）。',
      '如您的收货地址不在配送范围内，系统将在下单时提示您。',
      '海外配送暂未开放，敬请谅解。',
    ],
  },
  {
    title: '二、配送方式与时效',
    subsections: [
      {
        title: '2.1 标准配送',
        items: [
          '配送时效：订单支付成功后 3-7 个工作日送达（偏远地区可能延长 2-3 天）。',
          '配送费用：订单金额满 [X] 元免运费，未满 [X] 元收取运费 [X] 元。',
          '配送公司：合作物流包括顺丰、中通、圆通等，具体由我们根据收货地区选择最优物流。',
        ],
      },
      {
        title: '2.2 加急配送',
        items: [
          '配送时效：订单支付成功后 1-3 个工作日送达（仅限部分城市）。',
          '配送费用：在标准运费基础上加收 [X] 元加急费。',
          '支持城市：北京、上海、广州、深圳等主要城市（以下单时选项为准）。',
        ],
      },
      {
        title: '2.3 特别说明',
        items: [
          '以上时效为预计送达时间，不含节假日。',
          '实际配送时间可能受天气、交通、节假日等因素影响。',
          '大促期间（如双11、618等）配送时效可能延长，请以页面提示为准。',
        ],
      },
    ],
  },
  {
    title: '三、订单处理时间',
    items: [
      '工作日 15:00 前支付的订单，当日安排发货；15:00 后支付的订单，次日安排发货。',
      '周末及法定节假日的订单，将于下一个工作日安排发货。',
      '预售商品以商品详情页标注的发货时间为准。',
      '定制商品需额外制作时间，具体以商品详情页说明为准。',
    ],
  },
  {
    title: '四、物流查询',
    items: [
      '订单发货后，您将收到包含物流单号的短信或邮件通知。',
      '您也可以登录账户，在"我的订单"中查看实时物流信息。',
      '如物流信息长时间未更新，请联系客服协助查询。',
    ],
  },
  {
    title: '五、签收须知',
    items: [
      '请您在签收前检查包裹外观是否完好。如发现包裹破损、被拆封或明显异常，请当场拒签并联系我们。',
      '如您委托他人代签，视为您本人签收。',
      '签收后如发现商品存在质量问题，请按照我们的退换货政策处理。',
    ],
  },
  {
    title: '六、配送异常处理',
    subsections: [
      {
        title: '6.1 地址不详',
        content: '如因收货地址不详、错误导致配送失败，我们将联系您确认地址，重新配送产生的费用由您承担。',
      },
      {
        title: '6.2 无人签收',
        content: '快递员多次联系无人签收的包裹将退回至当地网点。请及时联系快递员重新安排配送，超过保留期限将退回至我们仓库。',
      },
      {
        title: '6.3 包裹丢失',
        content: '如确认包裹在配送过程中丢失，我们将为您重新发货或全额退款。',
      },
      {
        title: '6.4 物流延迟',
        content: '如遇物流延迟，我们将积极协调物流公司处理，并尽快为您解决。',
      },
    ],
  },
  {
    title: '七、特殊商品配送说明',
    items: [
      '包包产品在配送过程中使用防尘袋、填充物及加固纸箱包装，确保商品在运输过程中不受损。',
      '如收到商品后发现包装严重损坏导致商品受损，请在签收后 48 小时内联系客服。',
    ],
  },
  {
    title: '联系我们',
    type: 'contact',
    items: [
      '电子邮件：[请填写您的邮箱]',
      '客服电话：[请填写您的客服电话]',
      '在线客服时间：工作日 9:00-18:00',
    ],
  },
]

export default function ShippingPage() {
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
            配送信息
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl text-[#3C2415] mb-4 leading-tight">
            配送信息
          </h1>
          <p className="text-sm text-[#3C2415]/50">
            最后更新日期：2026年5月26日
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-12">
            感谢您选择我们的产品！我们致力于为您提供便捷、可靠的配送服务。请在下单前仔细阅读以下配送信息。
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-6">
                  {section.title}
                </h2>

                {section.items && !section.subsections && section.type !== 'contact' && (
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
                          <p className="text-sm text-[#3C2415]/70 leading-relaxed">
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

                {section.type === 'contact' && (
                  <div className="p-6 bg-[#F5F0E8] rounded-sm">
                    <ul className="space-y-2">
                      {section.items.map((item) => (
                        <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  )
}
