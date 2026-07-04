import { Router } from 'express'
import { eq } from 'drizzle-orm'
import authRoutes from './auth.routes'
import adminRoutes from './admin.routes'
import uploadRoutes from './upload.routes'
import productRoutes from './product.routes'
import categoryRoutes from './category.routes'
import cartRoutes from './cart.routes'
import orderRoutes from './order.routes'
import paymentRoutes from './payment.routes'
import addressRoutes from './address.routes'
import reviewRoutes from './review.routes'
import wishlistRoutes from './wishlist.routes'
import returnRoutes from './return.routes'
import { BannerController } from '../controllers/BannerController'
import { getSettingsCache } from '../services/settingsCache'
import { db } from '../config/database'
import { products } from '../db/schema'

type RouterType = ReturnType<typeof Router>
const router: RouterType = Router()

router.use('/auth', authRoutes)
router.use('/admin', adminRoutes)
router.use('/upload', uploadRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/cart', cartRoutes)
router.use('/orders', orderRoutes)
router.use('/payments', paymentRoutes)
router.use('/addresses', addressRoutes)
router.use('/reviews', reviewRoutes)
router.use('/wishlist', wishlistRoutes)
router.use('/returns', returnRoutes)

router.get('/banners', BannerController.getActive)

router.get('/settings/public', async (_req, res) => {
  try {
    const allSettings = await getSettingsCache()
    const socialKeys = ['instagram_url', 'facebook_url', 'tiktok_url', 'whatsapp_url', 'xiaohongshu_url', 'wechat_url']
    const social: Record<string, string> = {}
    for (const key of socialKeys) {
      if (allSettings[key]) {
        social[key] = allSettings[key]
      }
    }

    const storeInfo = {
      store_name: allSettings.store_name || 'AXIS O',
      store_logo: allSettings.store_logo || '',
      store_favicon: allSettings.store_favicon || '',
      store_email: allSettings.store_email || '',
      store_phone: allSettings.store_phone || '',
      default_language: allSettings.default_language || 'zh',
      default_currency: allSettings.default_currency || 'USD',
      free_shipping_threshold: allSettings.free_shipping_threshold || '200',
      shipping_fee: allSettings.shipping_fee || '50',
      express_shipping_fee: allSettings.express_shipping_fee || '50',
      estimated_delivery_days: allSettings.estimated_delivery_days || '7',
      return_address: allSettings.return_address || '',
    }

    const seoInfo = {
      meta_title_en: allSettings.meta_title_en || 'AXIS O - Luxury Leather Goods',
      meta_title_zh: allSettings.meta_title_zh || 'AXIS O - 奢华皮具',
      meta_description_en: allSettings.meta_description_en || 'Premium handcrafted leather bags and accessories',
      meta_description_zh: allSettings.meta_description_zh || '匠心打造的高端皮革手袋与配饰',
      meta_keywords_en: allSettings.meta_keywords_en || 'leather bags, handbags, luxury accessories, Italian craftsmanship',
      meta_keywords_zh: allSettings.meta_keywords_zh || '皮具, 手袋, 包包, 奢侈品, 意大利, 匠心, 极简设计',
      google_analytics_id: allSettings.google_analytics_id || '',
    }

    res.json({
      success: true,
      data: {
        social,
        store: storeInfo,
        seo: seoInfo,
      },
    })
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get settings' } })
  }
})

router.get('/health', (_req: any, res: any) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

// Dynamic Sitemap API
router.get('/sitemap.xml', async (_req, res) => {
  try {
    const SITE_URL = 'https://www.axiso.cn'
    const now = new Date().toISOString()

    // Fetch all active products
    const allProducts = await db
      .select({ id: products.id, slug: products.slug, updatedAt: products.updatedAt })
      .from(products)
      .where(eq(products.isActive, 1))

    const staticPages = [
      { path: '/zh', changefreq: 'daily', priority: '1.0' },
      { path: '/en', changefreq: 'daily', priority: '1.0' },
      { path: '/zh/products', changefreq: 'daily', priority: '0.9' },
      { path: '/en/products', changefreq: 'daily', priority: '0.9' },
      { path: '/zh/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/en/about', changefreq: 'monthly', priority: '0.7' },
      { path: '/zh/craftsmanship', changefreq: 'monthly', priority: '0.7' },
      { path: '/en/craftsmanship', changefreq: 'monthly', priority: '0.7' },
      { path: '/zh/sustainability', changefreq: 'monthly', priority: '0.7' },
      { path: '/en/sustainability', changefreq: 'monthly', priority: '0.7' },
      { path: '/zh/shipping', changefreq: 'monthly', priority: '0.6' },
      { path: '/en/shipping', changefreq: 'monthly', priority: '0.6' },
      { path: '/zh/return-policy', changefreq: 'yearly', priority: '0.4' },
      { path: '/en/return-policy', changefreq: 'yearly', priority: '0.4' },
      { path: '/zh/privacy', changefreq: 'yearly', priority: '0.3' },
      { path: '/en/privacy', changefreq: 'yearly', priority: '0.3' },
      { path: '/zh/terms', changefreq: 'yearly', priority: '0.3' },
      { path: '/en/terms', changefreq: 'yearly', priority: '0.3' },
    ]

    const escapeXml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n'
    xml += '        xmlns:xhtml="http://www.w3.org/1999/xhtml">\n'

    // Static pages
    for (const page of staticPages) {
      const altLang = page.path.startsWith('/zh') ? page.path.replace('/zh', '/en') : page.path.replace('/en', '/zh')
      const lang = page.path.startsWith('/zh') ? 'zh' : 'en'
      xml += '  <url>\n'
      xml += `    <loc>${escapeXml(`${SITE_URL}${page.path}`)}</loc>\n`
      xml += `    <lastmod>${now}</lastmod>\n`
      xml += `    <changefreq>${page.changefreq}</changefreq>\n`
      xml += `    <priority>${page.priority}</priority>\n`
      xml += `    <xhtml:link rel="alternate" hreflang="zh" href="${escapeXml(`${SITE_URL}${lang === 'zh' ? page.path : altLang}`)}"/>\n`
      xml += `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${SITE_URL}${lang === 'en' ? page.path : altLang}`)}"/>\n`
      xml += '  </url>\n'
    }

    // Dynamic product pages
    for (const product of allProducts) {
      for (const lang of ['zh', 'en']) {
        const path = `/${lang}/products/${product.id}`
        const altPath = `/${lang === 'zh' ? 'en' : 'zh'}/products/${product.id}`
        xml += '  <url>\n'
        xml += `    <loc>${escapeXml(`${SITE_URL}${path}`)}</loc>\n`
        xml += `    <lastmod>${product.updatedAt ? new Date(product.updatedAt).toISOString() : now}</lastmod>\n`
        xml += '    <changefreq>weekly</changefreq>\n'
        xml += '    <priority>0.8</priority>\n'
        xml += `    <xhtml:link rel="alternate" hreflang="zh" href="${escapeXml(`${SITE_URL}${lang === 'zh' ? path : altPath}`)}"/>\n`
        xml += `    <xhtml:link rel="alternate" hreflang="en" href="${escapeXml(`${SITE_URL}${lang === 'en' ? path : altPath}`)}"/>\n`
        xml += '  </url>\n'
      }
    }

    xml += '</urlset>'

    res.type('application/xml')
    res.send(xml)
  } catch (error) {
    res.status(500).type('application/xml').send('<?xml version="1.0" encoding="UTF-8"?><error>Failed to generate sitemap</error>')
  }
})

// Robots.txt API
router.get('/robots.txt', (_req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

Disallow: /zh/cart
Disallow: /en/cart
Disallow: /zh/checkout
Disallow: /en/checkout
Disallow: /zh/orders
Disallow: /en/orders
Disallow: /zh/returns
Disallow: /en/returns
Disallow: /zh/login
Disallow: /en/login
Disallow: /zh/register
Disallow: /en/register
Disallow: /zh/profile
Disallow: /en/profile
Disallow: /zh/addresses
Disallow: /en/addresses
Disallow: /admin/

Sitemap: https://www.axiso.cn/api/sitemap.xml
`
  res.type('text/plain').send(robotsTxt)
})

export default router
