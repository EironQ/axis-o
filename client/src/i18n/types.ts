import zh from './locales/zh.json'

export type Language = 'zh' | 'en'

type RecursiveKeyOf<TObj extends Record<string, unknown>> = {
  [K in keyof TObj & string]: TObj[K] extends Record<string, unknown>
    ? `${K}.${RecursiveKeyOf<TObj[K]>}`
    : K
}[keyof TObj & string]

export type TranslationKey = RecursiveKeyOf<typeof zh>
