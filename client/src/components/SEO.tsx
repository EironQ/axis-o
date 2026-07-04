import { Helmet } from 'react-helmet-async'
import { useSettings } from '../context/SettingsContext'

interface SEOProps {
  title?: string
  description?: string
  keywords?: string
  image?: string
  url?: string
}

const SITE_URL = 'https://www.axiso.cn'

export default function SEO({ title, description, keywords, image, url }: SEOProps) {
  const { seo } = useSettings()
  const lang = typeof window !== 'undefined'
    ? window.location.pathname.startsWith('/en') ? 'en' : 'zh'
    : 'zh'

  const siteTitle = lang === 'zh' ? seo.meta_title_zh : seo.meta_title_en
  const siteDescription = lang === 'zh' ? seo.meta_description_zh : seo.meta_description_en
  const siteKeywords = lang === 'zh' ? seo.meta_keywords_zh : seo.meta_keywords_en

  const fullTitle = title ? `${title} | ${siteTitle}` : siteTitle
  const metaDescription = description || siteDescription
  const metaKeywords = keywords || siteKeywords
  const canonicalUrl = url ? `${SITE_URL}${url}` : `${SITE_URL}${window.location.pathname}`
  const ogImage = image || `${SITE_URL}/favicon.svg`

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={metaDescription} />
      <meta name="keywords" content={metaKeywords} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={metaDescription} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />

      {/* Twitter Card */}
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={metaDescription} />
      <meta name="twitter:image" content={ogImage} />

      {/* Alternate language */}
      <link rel="alternate" hrefLang="zh" href={canonicalUrl.replace('/en/', '/zh/')} />
      <link rel="alternate" hrefLang="en" href={canonicalUrl.replace('/zh/', '/en/')} />
    </Helmet>
  )
}
