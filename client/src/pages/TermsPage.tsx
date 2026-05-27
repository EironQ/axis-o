import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const sections = [
  {
    title: '一、总则',
    items: [
      '本服务条款是您（以下简称"用户"）与本网站（以下简称"我们"）之间关于使用本网站服务所订立的协议。',
      '我们有权在必要时修改本服务条款，修改后的条款一经发布即替代原条款。您继续使用服务即视为接受修改后的条款。',
      '如您不同意本服务条款的任何内容，请立即停止使用本网站服务。',
    ],
  },
  {
    title: '二、账户注册与管理',
    items: [
      '您在注册账户时应提供真实、准确、完整的信息，并及时更新。因提供虚假信息导致的一切后果由您自行承担。',
      '您应妥善保管账户信息和密码，因您的原因导致账户被盗用或密码泄露的，我们不承担任何责任。',
      '您不得将账户出借、转让或出售给他人使用。如发现未经授权使用您账户的情况，请立即通知我们。',
    ],
  },
  {
    title: '三、商品信息与价格',
    items: [
      '我们将尽最大努力确保网站上商品信息的准确性，但对商品信息（包括但不限于图片、描述、规格等）不构成合同要约。',
      '商品价格可能随时调整，以您下单时网站显示的价格为准。',
      '如商品标价存在明显错误（如价格远低于正常水平），我们有权取消相关订单并通知您。',
      '网站上显示的商品颜色可能与实际商品存在细微差异，这取决于您的显示器设置，不构成商品质量问题。',
    ],
  },
  {
    title: '四、订单与支付',
    items: [
      '您提交订单即表示您确认购买该商品。我们有权在库存不足或其他合理原因下拒绝或取消订单。',
      '您在下单后应按照选择的支付方式及时完成支付。订单在支付完成后方为有效。',
      '我们支持的支付方式以网站支付页面显示为准。',
      '如因系统故障或其他原因导致支付异常，请及时联系客服处理。',
    ],
  },
  {
    title: '五、知识产权',
    items: [
      '本网站的所有内容，包括但不限于文字、图片、设计、商标、标识、音频、视频、软件等，均受知识产权法律法规保护。',
      '未经我们书面许可，您不得以任何方式复制、传播、展示、修改或创作与本网站内容相关的衍生作品。',
      '您在本网站发表的评论、晒图等内容，授予我们免费的、非独占的、全球性的使用许可，包括但不限于展示、传播和推广。',
    ],
  },
  {
    title: '六、用户行为规范',
    content: '您在使用本网站服务时，不得从事以下行为：',
    items: [
      '利用本网站从事任何违法或侵权活动；',
      '干扰或破坏本网站的正常运行；',
      '未经授权访问我们的系统或网络；',
      '收集或存储其他用户的个人信息；',
      '发布虚假、侮辱、诽谤或非法内容；',
      '规避、修改或破坏本网站的安全措施；',
      '利用自动程序（如机器人、爬虫等）访问本网站。',
    ],
  },
  {
    title: '七、免责声明',
    items: [
      '本网站按"现状"和"现有"基础提供服务，我们对服务的及时性、安全性、准确性不作明示或暗示的保证。',
      '对于因不可抗力（包括但不限于自然灾害、战争、罢工、网络攻击等）导致的服务中断或数据丢失，我们不承担责任。',
      '对于因第三方原因（如支付机构、物流公司等）导致的损失，我们不承担责任，但将协助您与第三方沟通。',
      '我们不对任何用户之间或用户与第三方之间的交易纠纷承担任何责任。',
    ],
  },
  {
    title: '八、责任限制',
    content: '在适用法律允许的最大范围内，我们对因使用或无法使用本网站服务而导致的任何直接、间接、附带、特殊或后果性损害不承担责任，且我们的总赔偿责任不超过您就相关服务已支付的金额。',
  },
  {
    title: '九、争议解决',
    items: [
      '本服务条款适用中华人民共和国法律。',
      '因本条款引起的或与之相关的任何争议，双方应首先友好协商解决。协商不成的，任何一方均可向我们所在地有管辖权的人民法院提起诉讼。',
    ],
  },
  {
    title: '十、其他条款',
    items: [
      '本服务条款的任何条款如被认定为无效或不可执行，不影响其他条款的效力。',
      '我们未行使或延迟行使任何权利，不构成对该权利的放弃。',
      '本服务条款的标题仅为方便阅读，不影响条款的解释。',
    ],
  },
  {
    title: '联系我们',
    type: 'contact',
    items: [
      '电子邮件：hreiron@gmail.com',
      '客服电话：[请填写您的客服电话]',
      '办公地址：[请填写您的办公地址]',
    ],
  },
]

export default function TermsPage() {
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
            服务条款
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl text-[#3C2415] mb-4 leading-tight">
            服务条款
          </h1>
          <p className="text-sm text-[#3C2415]/50">
            最后更新日期：2026年5月26日
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-12">
            欢迎访问和使用我们的网站。请您在使用本网站服务前，仔细阅读以下服务条款。您使用本网站即表示您同意接受本条款的约束。
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                {section.type !== 'contact' ? (
                  <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-6">
                    {section.title}
                  </h2>
                ) : (
                  <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-6">
                    {section.title}
                  </h2>
                )}

                {section.content && !section.items && (
                  <p className="text-sm text-[#3C2415]/70 leading-relaxed">
                    {section.content}
                  </p>
                )}

                {section.content && section.items && (
                  <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}

                {section.items && section.type !== 'contact' && (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed pl-5 relative">
                        <span className="absolute left-0 top-0 text-[#C89460]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
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
