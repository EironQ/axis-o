import { Router } from 'express'
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
      estimated_delivery_days: allSettings.estimated_delivery_days || '7',
    }

    res.json({
      success: true,
      data: {
        social,
        store: storeInfo,
      },
    })
  } catch {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get settings' } })
  }
})

router.get('/health', (_req: any, res: any) => {
  res.json({ success: true, data: { status: 'ok', timestamp: new Date().toISOString() } })
})

export default router
