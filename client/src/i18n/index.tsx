import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import type { Language, TranslationKey } from './types'
import zh from './locales/zh.json'
import en from './locales/en.json'

const translations: Record<Language, Record<string, unknown>> = { zh, en }

function getNestedValue(obj: Record<string, unknown>, path: string): string {
  const keys = path.split('.')
  let current: unknown = obj
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key]
    } else {
      return path
    }
  }
  return typeof current === 'string' ? current : path
}

function detectLanguage(): Language {
  const stored = localStorage.getItem('preferred_language')
  if (stored === 'zh' || stored === 'en') return stored
  const browserLang = navigator.language.toLowerCase()
  if (browserLang.startsWith('zh')) return 'zh'
  return 'en'
}

type TranslationParams = Record<string, string | number>

interface LanguageContextValue {
  lang: Language
  setLang: (lang: Language) => void
  t: (key: TranslationKey, params?: TranslationParams) => string
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: 'zh',
  setLang: () => {},
  t: (key: TranslationKey) => key,
})

export function LanguageProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate()
  const location = useLocation()

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const langFromUrl = (pathSegments[0] === 'zh' || pathSegments[0] === 'en') ? pathSegments[0] as Language : null

  const [lang, setLangState] = useState<Language>(langFromUrl || (() => {
    const detected = detectLanguage()
    localStorage.setItem('preferred_language', detected)
    return detected
  }))

  useEffect(() => {
    if (langFromUrl && langFromUrl !== lang) {
      setLangState(langFromUrl)
      localStorage.setItem('preferred_language', langFromUrl)
    }
  }, [langFromUrl, lang])

  const setLang = useCallback((newLang: Language) => {
    localStorage.setItem('preferred_language', newLang)
    const pathParts = location.pathname.split('/').filter(Boolean)
    if (pathParts[0] === 'zh' || pathParts[0] === 'en') {
      pathParts[0] = newLang
    }
    navigate(`/${pathParts.join('/')}${location.search}${location.hash}`, { replace: true })
  }, [location, navigate])

  const t = useCallback((key: TranslationKey, params?: TranslationParams): string => {
    const template = getNestedValue(translations[lang], key)
    if (!params) return template
    return template.replace(/\{(\w+)\}/g, (_match, paramKey: string) => {
      return params[paramKey] !== undefined ? String(params[paramKey]) : `{${paramKey}}`
    })
  }, [lang])

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useTranslation() {
  const ctx = useContext(LanguageContext)
  return { t: ctx.t, lang: ctx.lang }
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  return { lang: ctx.lang, setLang: ctx.setLang }
}
