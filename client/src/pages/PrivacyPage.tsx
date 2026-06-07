import { Link } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'

const sections = [
  {
    title: '一、我们收集的信息',
    subsections: [
      {
        title: '1.1 您主动提供的信息',
        items: [
          '注册信息：姓名、电子邮件地址、联系电话等。',
          '订单信息：收货地址、支付信息、购买记录等。',
          '客服沟通：您在与客服沟通时提供的个人信息及问题详情。',
          '用户反馈：您提交的评价、意见或建议。',
        ],
      },
      {
        title: '1.2 我们自动收集的信息',
        items: [
          '设备信息：设备型号、操作系统版本、唯一设备标识符等。',
          '日志信息：IP地址、访问时间、访问页面、浏览器类型等。',
          '位置信息：在获得您同意后，我们可能收集您的地理位置信息以提供更精准的服务。',
          'Cookie及类似技术：我们使用Cookie和类似技术来记录您的偏好和操作信息。',
        ],
      },
    ],
  },
  {
    title: '二、我们如何使用收集的信息',
    type: 'list',
    items: [
      '处理和完成您的订单；',
      '提供客户服务并回应您的咨询；',
      '发送订单状态通知及物流更新；',
      '在获得您同意的前提下，向您推送促销活动和新品信息；',
      '改进我们的产品和服务体验；',
      '防范欺诈和确保交易安全；',
      '遵守法律法规的要求。',
    ],
  },
  {
    title: '三、信息的共享与披露',
    content: '我们不会将您的个人信息出售给第三方。仅在以下情况下，我们可能会共享您的信息：',
    items: [
      '服务提供商：与为我们提供支付处理、物流配送、数据分析等服务的合作伙伴共享，但仅限于提供服务所必需的信息。',
      '法律要求：根据法律法规、法律程序或政府部门的强制性要求。',
      '安全保护：为保护我们及其他用户的安全、权利或财产而有必要披露时。',
      '业务转让：如涉及合并、收购或资产出售，我们会要求新的持有您个人信息的主体继续受本隐私政策的约束。',
    ],
  },
  {
    title: '四、信息的存储与保护',
    subsections: [
      {
        title: '4.1 存储地点',
        content: '您的个人信息将存储于中华人民共和国境内。如需跨境传输，我们将按照法律法规的要求进行。',
      },
      {
        title: '4.2 存储期限',
        content: '我们仅在为您提供服务所必需的期限内保留您的个人信息。超出必要期限后，我们将删除或匿名化处理您的个人信息。',
      },
      {
        title: '4.3 安全措施',
        items: [
          '数据加密传输（SSL/TLS）；',
          '访问权限控制；',
          '安全审计与监控；',
          '员工安全培训。',
        ],
      },
    ],
  },
  {
    title: '五、您的权利',
    items: [
      '访问权：您有权访问您的个人信息。',
      '更正权：您有权要求我们更正不准确的个人信息。',
      '删除权：在特定情况下，您有权要求我们删除您的个人信息。',
      '撤回同意权：您有权撤回之前给予的同意。',
      '数据可携带权：您有权获取您的个人信息副本。',
    ],
    content: '如需行使上述权利，请通过本政策末尾的联系方式与我们联系。',
  },
  {
    title: '六、Cookie政策',
    items: [
      '记住您的登录状态和偏好设置；',
      '分析网站流量和使用情况；',
      '提供个性化的内容和推荐。',
    ],
    content: '您可以通过浏览器设置管理或删除Cookie。请注意，禁用Cookie可能影响您使用我们网站的部分功能。',
  },
  {
    title: '七、第三方链接',
    content: '我们的网站可能包含指向第三方网站的链接。我们对这些第三方网站的隐私实践不承担责任，建议您阅读它们的隐私政策。',
  },
  {
    title: '八、儿童隐私',
    content: '我们的服务不面向14岁以下的儿童。我们不会故意收集儿童的个人信息。如果我们发现错误收集了儿童的信息，将立即删除。',
  },
  {
    title: '九、隐私政策的变更',
    content: '我们可能会不时更新本隐私政策。更新后的政策将在本页面上发布，并更新"最后更新日期"。对于重大变更，我们将通过网站公告、电子邮件或其他合理方式通知您。',
  },
  {
    title: '十、联系我们',
    contact: true,
    items: [
      '电子邮件：axis-o@qq.com',
      '客服电话：[请填写您的客服电话]',
      '办公地址：[请填写您的办公地址]',
    ],
    content: '我们将在15个工作日内回复您的请求。',
  },
]

export default function PrivacyPage() {
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
            隐私政策
          </p>
          <h1 className="font-['Playfair_Display'] text-4xl md:text-5xl lg:text-6xl text-[#3C2415] mb-4 leading-tight">
            隐私政策
          </h1>
          <p className="text-sm text-[#3C2415]/50">
            最后更新日期：2026年5月26日
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[1440px] px-8 py-16 md:py-20">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-12">
            感谢您访问我们的网站。我们深知个人信息对您的重要性，并将按照法律法规的规定，保护您的个人信息及隐私安全。我们制定本隐私政策以帮助您了解我们如何收集、使用、存储和保护您的个人信息。请在使用我们的服务前，仔细阅读本隐私政策。
          </p>

          <div className="space-y-12">
            {sections.map((section) => (
              <section key={section.title}>
                <h2 className="font-['Playfair_Display'] text-2xl text-[#3C2415] mb-6">
                  {section.title}
                </h2>

                {section.type === 'list' && section.items && (
                  <ul className="space-y-2">
                    {section.items.map((item) => (
                      <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed pl-5 relative">
                        <span className="absolute left-0 top-0 text-[#C89460]">•</span>
                        {item}
                      </li>
                    ))}
                  </ul>
                )}

                {section.content && !section.subsections && (
                  <p className="text-sm text-[#3C2415]/70 leading-relaxed mb-4">
                    {section.content}
                  </p>
                )}

                {section.items && section.type !== 'list' && (
                  <ul className="space-y-2 mb-4">
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

                {section.contact && (
                  <div className="mt-4 p-6 bg-[#F5F0E8] rounded-sm">
                    {section.items && (
                      <ul className="space-y-2 mb-3">
                        {section.items.map((item) => (
                          <li key={item} className="text-sm text-[#3C2415]/70 leading-relaxed">
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}
                    {section.content && (
                      <p className="text-sm text-[#3C2415]/50 leading-relaxed">
                        {section.content}
                      </p>
                    )}
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
