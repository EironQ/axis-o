import express, { Express } from 'express'
import path from 'path'
import { fileURLToPath } from 'url'
import cors from 'cors'
import helmet from 'helmet'
import { env } from './config/env'
import { apiLimiter } from './middleware/rateLimiter'
import { errorHandler } from './middleware/errorHandler'
import routes from './routes'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app: Express = express()

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://axis.cnprodo.com", "https://api.stripe.com"],
    },
  },
}))
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || 
        origin.startsWith('http://localhost') || 
        origin.startsWith('http://192.168.') || 
        origin.startsWith('http://10.') ||
        origin.startsWith('http://172.') ||
        origin === 'https://axis.cnprodo.com' ||
        origin.startsWith('https://') ||
        origin.startsWith('http://')
    ) {
      callback(null, true)
    } else {
      callback(new Error('Not allowed by CORS'))
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language', 'Content-Disposition'],
}

app.use(cors(corsOptions))

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))
app.use('/api/payments/paypal/webhook', express.raw({ type: 'application/json' }))

app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')))
app.use('/api/uploads', express.static(path.join(__dirname, '..', 'uploads')))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api', apiLimiter)
app.use('/api', routes)

app.use(errorHandler)

export default app
