import { db } from '../config/database'
import { users } from '../db/schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../utils/password'

async function resetAdminPassword() {
  console.log('🔑 Resetting admin password...')

  const email = 'admin@axis-o.com'
  const newPassword = 'password'

  const existingAdmin = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)

  if (existingAdmin.length === 0) {
    console.log('❌ Admin user not found')
    process.exit(1)
    return
  }

  const passwordHash = await hashPassword(newPassword)

  await db.update(users)
    .set({ passwordHash })
    .where(eq(users.email, email))

  console.log('✅ Admin password reset successfully')
  console.log('   Email: admin@axis-o.com')
  console.log('   Password: password')
  process.exit(0)
}

resetAdminPassword().catch((err) => {
  console.error('❌ Failed to reset admin password:', err)
  process.exit(1)
})