import app from './app'
import { env } from './config/env'
import os from 'os'

function getLocalIP(): string {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]!) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}

const server = app.listen(env.PORT, '0.0.0.0', () => {
  console.log(`\n🚀 AXIS O API Server running on http://localhost:${env.PORT}`)
  console.log(`📦 Environment: ${env.NODE_ENV}`)
  console.log(`🌐 CORS Origin: ${env.CORS_ORIGIN}`)
  console.log(`📋 Health check: http://localhost:${env.PORT}/api/health`)
  console.log(`🔗 LAN Access: http://${getLocalIP()}:${env.PORT}\n`)
})

process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...')
  server.close(() => process.exit(0))
})

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...')
  server.close(() => process.exit(0))
})
