import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const envFile = process.env.NODE_ENV === 'production'
  ? path.resolve(__dirname, '../../.env.production')
  : path.resolve(__dirname, '../../.env')

dotenv.config({ path: envFile })

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '3001', 10),

  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://root:password@localhost:3306/axis_o',

  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'axis-o-dev-secret-change-in-production',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'axis-o-refresh-secret-change-in-production',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '8h',
  JWT_ADMIN_EXPIRES_IN: process.env.JWT_ADMIN_EXPIRES_IN || '4h',
  JWT_REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '90d',

  // CORS
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
  STRIPE_PUBLISHABLE_KEY: process.env.STRIPE_PUBLISHABLE_KEY || '',
  STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',

  // PayPal
  PAYPAL_CLIENT_ID: process.env.PAYPAL_CLIENT_ID || '',
  PAYPAL_CLIENT_SECRET: process.env.PAYPAL_CLIENT_SECRET || '',
  PAYPAL_MODE: process.env.PAYPAL_MODE || 'sandbox',
  PAYPAL_WEBHOOK_ID: process.env.PAYPAL_WEBHOOK_ID || '',

  // Alipay Global
  ALIPAY_APP_ID: process.env.ALIPAY_APP_ID || '',
  ALIPAY_PRIVATE_KEY: process.env.ALIPAY_PRIVATE_KEY || '',
  ALIPAY_PUBLIC_KEY: process.env.ALIPAY_PUBLIC_KEY || '',
  ALIPAY_GATEWAY: process.env.ALIPAY_GATEWAY || 'https://openapi.alipay.com/gateway.do',
  ALIPAY_MODE: process.env.ALIPAY_MODE || 'sandbox',

  // Airwallex
  AIRWALLEX_CLIENT_ID: process.env.AIRWALLEX_CLIENT_ID || '',
  AIRWALLEX_API_KEY: process.env.AIRWALLEX_API_KEY || '',
  AIRWALLEX_WEBHOOK_SIGNING_KEY: process.env.AIRWALLEX_WEBHOOK_SIGNING_KEY || '',
  AIRWALLEX_MODE: process.env.AIRWALLEX_MODE || 'sandbox',

  // Email
  SENDGRID_API_KEY: process.env.SENDGRID_API_KEY || '',
  EMAIL_FROM: process.env.EMAIL_FROM || 'axis-o@qq.com',

  // API Base URL
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',
  
  // Frontend URL
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  RATE_LIMIT_MAX: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
} as const
