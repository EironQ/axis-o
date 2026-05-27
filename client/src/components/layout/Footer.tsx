import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail, Instagram } from 'lucide-react'
import { useCookieConsent } from '@/components/ui/CookieConsent'
import { useSettings } from '@/context/SettingsContext'

const footerLinks = {
  '探索': [
    { label: '经典系列', href: '/products?series=classic' },
    { label: '轻奢系列', href: '/products?series=luxe' },
    { label: '旅行系列', href: '/products?series=travel' },
    { label: '全部产品', href: '/products' },
  ],
  '关于': [
    { label: '品牌故事', href: '/about' },
    { label: '工艺与材质', href: '/about' },
    { label: '可持续发展', href: '/about' },
    { label: '常见问题', href: '#' },
  ],
  '服务': [
    { label: '联系我们', href: '#' },
    { label: '配送信息', href: '/shipping' },
    { label: '退换政策', href: '/return-policy' },
    { label: '产品保修', href: '#' },
  ],
}

const socialIcons: Record<string, { icon: ReactNode; label: string }> = {
  instagram_url: { icon: <Instagram size={18} />, label: 'Instagram' },
  facebook_url: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M24 12.073c0-6.627-5.373-12-12-12S0 5.446 0 12.073c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>
    ),
    label: 'Facebook',
  },
  tiktok_url: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
      </svg>
    ),
    label: 'TikTok',
  },
  whatsapp_url: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
      </svg>
    ),
    label: 'WhatsApp',
  },
  xiaohongshu_url: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.5 14h-9a.5.5 0 01-.5-.5v-7a.5.5 0 01.5-.5h9a.5.5 0 01.5.5v7a.5.5 0 01-.5.5z"/>
      </svg>
    ),
    label: '小红书',
  },
  wechat_url: {
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.045.246.246 0 00.242-.245c0-.06-.024-.12-.04-.178l-.325-1.233a.492.492 0 01.178-.554C23.028 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-7.062-6.122zm-2.18 2.945c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.97-.983zm4.844 0c.535 0 .969.44.969.983a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.983.97-.983z"/>
      </svg>
    ),
    label: '微信',
  },
}

export default function Footer() {
  const { showSettings } = useCookieConsent()
  const { store, social } = useSettings()
  const storeName = store.store_name
  const socialLinks = social as Record<string, string>

  const enabledSocials = Object.entries(socialIcons).filter(
    ([key]) => socialLinks[key]
  )

  return (
    <footer className="bg-[#3C2415] text-[#FAF7F2]/70">
      <div className="mx-auto max-w-[1440px] px-8 pt-20 pb-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-16">
          <div className="col-span-2">
            <Link to="/" className="inline-block mb-5">
              <span className="font-['Playfair_Display'] text-2xl tracking-[0.3em] text-[#FAF7F2]">
                {storeName}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs mt-4">
              以极简美学重新定义时尚包包。<br />
              我们相信，真正的优雅源于对细节的不懈追求。
            </p>
            <div className="flex gap-4 mt-6">
              {enabledSocials.length > 0 ? (
                enabledSocials.map(([key, { icon, label }]) => (
                  <a
                    key={key}
                    href={socialLinks[key]}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#FAF7F2]/50 hover:text-[#FAF7F2] transition-colors"
                    aria-label={label}
                  >
                    {icon}
                  </a>
                ))
              ) : (
                <>
                  <a href="#" className="text-[#FAF7F2]/50 hover:text-[#FAF7F2] transition-colors" aria-label="Instagram">
                    <Instagram size={18} />
                  </a>
                  <a href="#" className="text-[#FAF7F2]/50 hover:text-[#FAF7F2] transition-colors" aria-label="邮件">
                    <Mail size={18} />
                  </a>
                </>
              )}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h4 className="text-sm tracking-[0.2em] uppercase text-[#FAF7F2] mb-5">
                {title}
              </h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm hover:text-[#C89460] transition-colors duration-300"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-[#FAF7F2]/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs">&copy; 2026 {storeName}. All rights reserved.</p>
          <div className="flex gap-6 text-xs">
            <Link to="/privacy" className="hover:text-[#C89460] transition-colors">隐私政策</Link>
            <Link to="/terms" className="hover:text-[#C89460] transition-colors">服务条款</Link>
            <button onClick={showSettings} className="hover:text-[#C89460] transition-colors">Cookie 设置</button>
          </div>
        </div>
      </div>
    </footer>
  )
}
