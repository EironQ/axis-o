import { Request, Response } from 'express'
import { db } from '../config/database'
import { settings } from '../db/schema'
import { eq, inArray } from 'drizzle-orm'
import { v4 as uuidv4 } from '../utils/uuid'
import { refreshSettingsCache } from '../services/settingsCache'
import { EmailService } from '../services/email'

const DEFAULT_SETTINGS: Record<string, { value: string; group: string; description: string }> = {
  store_name: { value: 'AXIS O', group: 'general', description: '店铺名称' },
  store_logo: { value: '', group: 'general', description: '店铺Logo URL' },
  store_favicon: { value: '', group: 'general', description: 'Favicon URL' },
  store_email: { value: 'contact@axis-o.com', group: 'general', description: '联系邮箱' },
  store_phone: { value: '', group: 'general', description: '联系电话' },
  default_language: { value: 'zh', group: 'general', description: '默认语言' },
  default_currency: { value: 'USD', group: 'general', description: '默认货币' },
  timezone: { value: 'Asia/Shanghai', group: 'general', description: '时区' },
  free_shipping_threshold: { value: '200', group: 'shipping', description: '免运费门槛金额(USD)' },
  shipping_fee: { value: '50', group: 'shipping', description: '运费金额(USD)' },
  estimated_delivery_days: { value: '7', group: 'shipping', description: '预计配送天数' },
  instagram_url: { value: '', group: 'social', description: 'Instagram链接' },
  facebook_url: { value: '', group: 'social', description: 'Facebook链接' },
  tiktok_url: { value: '', group: 'social', description: 'TikTok链接' },
  whatsapp_url: { value: '', group: 'social', description: 'WhatsApp链接' },
  xiaohongshu_url: { value: '', group: 'social', description: '小红书链接' },
  wechat_url: { value: '', group: 'social', description: '微信链接' },
  stripe_public_key: { value: '', group: 'payment', description: 'Stripe公钥' },
  stripe_secret_key: { value: '', group: 'payment', description: 'Stripe密钥' },
  stripe_webhook_secret: { value: '', group: 'payment', description: 'Stripe Webhook密钥' },
  paypal_client_id: { value: '', group: 'payment', description: 'PayPal Client ID' },
  paypal_client_secret: { value: '', group: 'payment', description: 'PayPal Client Secret' },
  paypal_webhook_id: { value: '', group: 'payment', description: 'PayPal Webhook ID' },
  paypal_mode: { value: 'sandbox', group: 'payment', description: 'PayPal模式' },
  antym_client_id: { value: '', group: 'payment', description: 'Antom Client ID' },
  antym_private_key: { value: '', group: 'payment', description: 'Antom商户私钥' },
  antym_public_key: { value: '', group: 'payment', description: 'Antom公钥' },
  antym_mode: { value: 'sandbox', group: 'payment', description: 'Antom模式' },
  sendgrid_api_key: { value: '', group: 'email', description: 'SendGrid API Key' },
  smtp_host: { value: '', group: 'email', description: 'SMTP服务器' },
  smtp_port: { value: '587', group: 'email', description: 'SMTP端口' },
  smtp_user: { value: '', group: 'email', description: 'SMTP用户名' },
  smtp_password: { value: '', group: 'email', description: 'SMTP密码' },
  smtp_from_email: { value: '', group: 'email', description: '发件人邮箱' },
  smtp_from_name: { value: 'AXIS O', group: 'email', description: '发件人名称' },
  meta_title_en: { value: 'AXIS O - Luxury Leather Goods', group: 'seo', description: 'SEO标题(英文)' },
  meta_title_zh: { value: 'AXIS O - 奢华皮具', group: 'seo', description: 'SEO标题(中文)' },
  meta_description_en: { value: 'Premium handcrafted leather bags and accessories', group: 'seo', description: 'SEO描述(英文)' },
  meta_description_zh: { value: '匠心打造的高端皮革手袋与配饰', group: 'seo', description: 'SEO描述(中文)' },
  google_analytics_id: { value: '', group: 'seo', description: 'Google Analytics ID' },
}

async function ensureDefaults() {
  const existing = await db.select({ key: settings.key }).from(settings)
  const existingKeys = new Set(existing.map((r) => r.key))

  const missingKeys = Object.keys(DEFAULT_SETTINGS).filter((k) => !existingKeys.has(k))
  if (missingKeys.length > 0) {
    await db.insert(settings).values(
      missingKeys.map((key) => ({
        id: uuidv4(),
        key,
        value: DEFAULT_SETTINGS[key].value,
        group: DEFAULT_SETTINGS[key].group,
        description: DEFAULT_SETTINGS[key].description,
      }))
    )
  }
}

export const SettingsController = {
  getAll: async (req: Request, res: Response) => {
    try {
      await ensureDefaults()

      const { group } = req.query as any

      const result = await db
        .select({
          id: settings.id,
          key: settings.key,
          value: settings.value,
          group: settings.group,
          description: settings.description,
          updatedAt: settings.updatedAt,
        })
        .from(settings)
        .where(group ? eq(settings.group, group) : undefined)
        .orderBy(settings.group, settings.key)

      const grouped: Record<string, Record<string, string>> = {}
      result.forEach((item) => {
        if (!grouped[item.group]) {
          grouped[item.group] = {}
        }
        grouped[item.group][item.key] = item.value
      })

      res.json({
        success: true,
        data: {
          settings: result,
          grouped,
        },
      })
    } catch (error) {
      console.error('Get settings error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to get settings' } })
    }
  },

  update: async (req: Request, res: Response) => {
    try {
      const updates: Record<string, string> = req.body

      if (!updates || typeof updates !== 'object' || Object.keys(updates).length === 0) {
        res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'No settings provided' } })
        return
      }

      await ensureDefaults()

      const existingKeys = await db.select({ key: settings.key }).from(settings)
      const validKeys = new Set(existingKeys.map((r) => r.key))

      const invalidKeys = Object.keys(updates).filter((k) => !validKeys.has(k))
      if (invalidKeys.length > 0) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: `Invalid setting keys: ${invalidKeys.join(', ')}` },
        })
        return
      }

      for (const [key, value] of Object.entries(updates)) {
        await db.update(settings).set({ value, updatedAt: new Date() }).where(eq(settings.key, key))
      }

      await refreshSettingsCache()

      const updated = await db
        .select({
          key: settings.key,
          value: settings.value,
          group: settings.group,
          updatedAt: settings.updatedAt,
        })
        .from(settings)
        .where(inArray(settings.key, Object.keys(updates)))

      res.json({
        success: true,
        data: { updated: Object.fromEntries(updated.map((r) => [r.key, r.value])) },
      })
    } catch (error) {
      console.error('Update settings error:', error)
      res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to update settings' } })
    }
  },

  testEmail: async (req: Request, res: Response) => {
    try {
      const { email, smtpConfig } = req.body

      if (!email || typeof email !== 'string') {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Email address is required' },
        })
        return
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Invalid email address format' },
        })
        return
      }

      console.log('[testEmail] Received smtpConfig:', JSON.stringify(smtpConfig, null, 2))
      const result = await EmailService.sendTestEmail(email, smtpConfig)

      if (result.success) {
        res.json({
          success: true,
          message: 'Test email sent successfully! Please check your inbox.',
        })
      } else {
        res.status(500).json({
          success: false,
          error: { code: 'EMAIL_SEND_ERROR', message: result.error || 'Failed to send test email' },
        })
      }
    } catch (error) {
      console.error('Test email error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to send test email' },
      })
    }
  },

  checkEmailHealth: async (req: Request, res: Response) => {
    try {
      const health = await EmailService.checkHealth()

      res.json({
        success: true,
        data: {
          healthy: health.healthy,
          message: health.message,
        },
      })
    } catch (error) {
      console.error('Email health check error:', error)
      res.status(500).json({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Failed to check email service health' },
      })
    }
  },
}