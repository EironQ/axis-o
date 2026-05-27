import app from './app'
import { env } from './config/env'

const server = app.listen(env.PORT, () => {
  console.log(`\n🚀 AXIS O API Server running on http://localhost:${env.PORT}`)
  console.log(`📦 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS Origin: ${env.CORS_ORIGIN}`)
  console.log(`📋 Health check: http://localhost:${env.PORT}/api/health\n`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  server.close(() => process.exit(0))
})
