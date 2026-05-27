import { useState, useEffect, createContext, useContext, type ReactNode } from 'react'
import { X, Settings, Shield, BarChart3, Megaphone } from 'lucide-react'

interface CookiePreferences {
  essential: boolean
  analytics: boolean
  marketing: boolean
}

interface CookieConsentContextValue {
  preferences: CookiePreferences
  showSettings: () => void
  hasConsented: boolean
}

const defaultPreferences: CookiePreferences = {
  essential: true,
  analytics: false,
  marketing: false,
}

const COOKIE_KEY = 'axis-o-cookie-consent'

const CookieConsentContext = createContext<CookieConsentContextValue | null>(null)

export function useCookieConsent() {
  const context = useContext(CookieConsentContext)
  if (!context) {
    return { preferences: defaultPreferences, showSettings: () => {}, hasConsented: false }
  }
  return context
}

function loadPreferences(): { preferences: CookiePreferences; version: number } | null {
  try {
    const stored = localStorage.getItem(COOKIE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {}
  return null
}

function savePreferences(preferences: CookiePreferences) {
  localStorage.setItem(COOKIE_KEY, JSON.stringify({ preferences, version: 1 }))
}

const categories = [
  {
    key: 'essential' as const,
    icon: Shield,
    title: '必要 Cookie',
    desc: '网站正常运行所必需，包括登录状态、购物车等核心功能。始终启用。',
    alwaysOn: true,
  },
  {
    key: 'analytics' as const,
    icon: BarChart3,
    title: '分析 Cookie',
    desc: '帮助我们了解访客如何使用网站，以改善用户体验。包括页面访问统计等。',
    alwaysOn: false,
  },
  {
    key: 'marketing' as const,
    icon: Megaphone,
    title: '营销 Cookie',
    desc: '用于追踪跨网站的访问行为，以提供个性化的广告和推荐内容。',
    alwaysOn: false,
  },
]

export default function CookieConsentProvider({ children }: { children: ReactNode }) {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [preferences, setPreferences] = useState<CookiePreferences>(defaultPreferences)
  const [hasConsented, setHasConsented] = useState(false)

  useEffect(() => {
    const saved = loadPreferences()
    if (saved) {
      setPreferences(saved.preferences)
      setHasConsented(true)
    } else {
      setShowBanner(true)
    }
  }, [])

  const acceptAll = () => {
    const prefs: CookiePreferences = { essential: true, analytics: true, marketing: true }
    setPreferences(prefs)
    savePreferences(prefs)
    setHasConsented(true)
    setShowBanner(false)
  }

  const rejectAll = () => {
    const prefs: CookiePreferences = { essential: true, analytics: false, marketing: false }
    setPreferences(prefs)
    savePreferences(prefs)
    setHasConsented(true)
    setShowBanner(false)
  }

  const saveSettings = (prefs: CookiePreferences) => {
    setPreferences(prefs)
    savePreferences(prefs)
    setHasConsented(true)
    setShowSettingsModal(false)
    setShowBanner(false)
  }

  const showSettings = () => {
    setShowSettingsModal(true)
    setShowBanner(false)
  }

  return (
    <CookieConsentContext.Provider value={{ preferences, showSettings, hasConsented }}>
      {children}

      {showBanner && (
        <div className="fixed bottom-0 left-0 right-0 z-50 animate-slide-up">
          <div className="bg-[#3C2415] text-[#FAF7F2]/80">
            <div className="mx-auto max-w-[1440px] px-8 py-6">
              <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Settings size={16} className="text-[#C89460]" />
                    <span className="text-sm font-medium text-[#FAF7F2]">Cookie 设置</span>
                  </div>
                  <p className="text-xs leading-relaxed">
                    我们使用 Cookie 来提升您的浏览体验、分析网站流量并为您提供个性化内容。
                    请选择您的偏好设置。
                  </p>
                </div>
                <div className="flex items-center gap-3 flex-shrink-0">
                  <button
                    onClick={showSettings}
                    className="text-xs tracking-wider uppercase text-[#FAF7F2]/60 hover:text-[#FAF7F2] transition-colors px-4 py-2 border border-[#FAF7F2]/20 hover:border-[#FAF7F2]/40"
                  >
                    自定义
                  </button>
                  <button
                    onClick={rejectAll}
                    className="text-xs tracking-wider uppercase text-[#FAF7F2]/60 hover:text-[#FAF7F2] transition-colors px-4 py-2"
                  >
                    仅必要
                  </button>
                  <button
                    onClick={acceptAll}
                    className="text-xs tracking-wider uppercase text-[#FAF7F2] bg-[#C89460] hover:bg-[#B8834E] transition-colors px-6 py-2"
                  >
                    接受全部
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSettingsModal && (
        <CookieSettingsModal
          preferences={preferences}
          onSave={saveSettings}
          onClose={() => setShowSettingsModal(false)}
        />
      )}
    </CookieConsentContext.Provider>
  )
}

function CookieSettingsModal({
  preferences,
  onSave,
  onClose,
}: {
  preferences: CookiePreferences
  onSave: (prefs: CookiePreferences) => void
  onClose: () => void
}) {
  const [localPrefs, setLocalPrefs] = useState<CookiePreferences>(preferences)

  const toggle = (key: keyof CookiePreferences) => {
    if (key === 'essential') return
    setLocalPrefs((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div
        className="absolute inset-0 bg-[#3C2415]/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-[#FAF7F2] w-full max-w-lg mx-4 rounded-lg shadow-2xl animate-fadeIn">
        <div className="flex items-center justify-between p-6 border-b border-[#E5DDD3]">
          <div className="flex items-center gap-2">
            <Settings size={18} className="text-[#C89460]" />
            <h3 className="font-['Playfair_Display'] text-xl text-[#3C2415]">Cookie 设置</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#3C2415]/40 hover:text-[#3C2415] transition-colors"
            aria-label="关闭"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-[#3C2415]/60 leading-relaxed">
            您可以根据以下分类管理 Cookie 偏好。必要 Cookie 始终启用，以确保网站正常运行。
          </p>

          {categories.map((cat) => (
            <div
              key={cat.key}
              className="flex items-start gap-4 p-4 bg-white border border-[#E5DDD3] rounded"
            >
              <div className="w-9 h-9 rounded-full bg-[#C89460]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <cat.icon size={16} className="text-[#C89460]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-medium text-[#3C2415]">{cat.title}</h4>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                    <input
                      type="checkbox"
                      checked={localPrefs[cat.key]}
                      disabled={cat.alwaysOn}
                      onChange={() => toggle(cat.key)}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#D4C4B0] rounded-full peer peer-checked:bg-[#C89460] peer-disabled:opacity-50 peer-disabled:cursor-not-allowed after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:after:translate-x-4" />
                  </label>
                </div>
                <p className="text-xs text-[#3C2415]/50 mt-1 leading-relaxed">{cat.desc}</p>
                {cat.alwaysOn && (
                  <span className="inline-block mt-1.5 text-[10px] tracking-wider uppercase text-[#C89460]">
                    始终启用
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-3 p-6 border-t border-[#E5DDD3]">
          <button
            onClick={onClose}
            className="flex-1 border border-[#3C2415]/20 px-4 py-2.5 text-xs tracking-wider uppercase text-[#3C2415]/60 hover:text-[#3C2415] hover:border-[#3C2415]/40 transition-all"
          >
            取消
          </button>
          <button
            onClick={() => onSave(localPrefs)}
            className="flex-1 bg-[#3C2415] text-[#FAF7F2] px-4 py-2.5 text-xs tracking-wider uppercase hover:bg-[#5C3A2A] transition-all"
          >
            保存设置
          </button>
        </div>
      </div>
    </div>
  )
}
