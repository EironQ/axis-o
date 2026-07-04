import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'

export interface StoreSettings {
  store_name: string
  store_logo: string
  store_favicon: string
  store_email: string
  store_phone: string
  default_language: string
  default_currency: string
  free_shipping_threshold: string
  shipping_fee: string
  express_shipping_fee: string
  return_address: string
  estimated_delivery_days: string
}

export interface SocialLinks {
  instagram_url?: string
  facebook_url?: string
  tiktok_url?: string
  whatsapp_url?: string
  xiaohongshu_url?: string
  wechat_url?: string
}

export interface SeoSettings {
  meta_title_en: string
  meta_title_zh: string
  meta_description_en: string
  meta_description_zh: string
  meta_keywords_en: string
  meta_keywords_zh: string
  google_analytics_id: string
}

export interface PublicSettings {
  social: SocialLinks
  store: StoreSettings
  seo: SeoSettings
}

const defaultSeo: SeoSettings = {
  meta_title_en: 'AXIS O - Luxury Leather Goods',
  meta_title_zh: 'AXIS O - 奢华皮具',
  meta_description_en: 'Premium handcrafted leather bags and accessories',
  meta_description_zh: '匠心打造的高端皮革手袋与配饰',
  meta_keywords_en: 'leather bags, handbags, luxury accessories, Italian craftsmanship',
  meta_keywords_zh: '皮具, 手袋, 包包, 奢侈品, 意大利, 匠心, 极简设计',
  google_analytics_id: '',
}

interface SettingsContextValue {
  settings: PublicSettings | null
  store: StoreSettings
  social: SocialLinks
  seo: SeoSettings
  loading: boolean
}

const defaultStore: StoreSettings = {
  store_name: 'AXIS O',
  store_logo: '',
  store_favicon: '',
  store_email: '',
  store_phone: '',
  default_language: 'zh',
  default_currency: 'USD',
  free_shipping_threshold: '200',
  shipping_fee: '50',
  express_shipping_fee: '50',
  return_address: '',
  estimated_delivery_days: '7',
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  store: defaultStore,
  social: {},
  seo: defaultSeo,
  loading: true,
})

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PublicSettings | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings/public')
      .then((res) => res.json())
      .then((result) => {
        if (result.success) {
          setSettings(result.data)
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (settings?.store?.store_favicon) {
      let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]')
      if (!link) {
        link = document.createElement('link')
        link.rel = 'icon'
        document.head.appendChild(link)
      }
      link.href = settings.store.store_favicon.startsWith('http') || settings.store.store_favicon.startsWith('/')
        ? settings.store.store_favicon
        : `/${settings.store.store_favicon}`
    }
  }, [settings?.store?.store_favicon])

  const store = settings?.store || defaultStore
  const social = settings?.social || {}
  const seo = settings?.seo || defaultSeo

  // Google Analytics
  useEffect(() => {
    if (seo.google_analytics_id && typeof window !== 'undefined') {
      const w = window as any
      w.dataLayer = w.dataLayer || []
      w.dataLayer.push(['js', new Date()])
      w.dataLayer.push(['config', seo.google_analytics_id])
      if (!document.querySelector('script[src*="googletagmanager"]')) {
        const script = document.createElement('script')
        script.async = true
        script.src = `https://www.googletagmanager.com/gtag/js?id=${seo.google_analytics_id}`
        document.head.appendChild(script)
      }
    }
  }, [seo.google_analytics_id])

  return (
    <SettingsContext.Provider value={{ settings, store, social, seo, loading }}>
      {children}
    </SettingsContext.Provider>
  )
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext)
  if (!ctx) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return ctx
}
