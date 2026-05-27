import { env } from '../config/env'

console.log('[Schema] Database URL:', env.DATABASE_URL.replace(/\/\/.*@/, '//***@'))

import { users } from './schema'

console.log('[Schema] Tables registered:', 'users')
console.log('[Schema] Ready for drizzle-kit push/migrate')

export { users }
