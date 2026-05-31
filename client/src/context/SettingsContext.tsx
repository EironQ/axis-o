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

export interface PublicSettings {
  social: SocialLinks
  store: StoreSettings
}

interface SettingsContextValue {
  settings: PublicSettings | null
  store: StoreSettings
  social: SocialLinks
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
  estimated_delivery_days: '7',
}

const SettingsContext = createContext<SettingsContextValue>({
  settings: null,
  store: defaultStore,
  social: {},
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

  return (
    <SettingsContext.Provider value={{ settings, store, social, loading }}>
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
