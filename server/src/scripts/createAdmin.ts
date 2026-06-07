import { db } from '../config/database'
import { users } from '../db/schema'
import { v4 as uuidv4 } from '../utils/uuid'
import { hashPassword } from '../utils/password'
import { eq } from 'drizzle-orm'

async function createAdmin() {
  console.log('🔑 Creating admin user...')

  const email = 'axis-o@qq.com'
  const existingAdmin = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1)

  if (existingAdmin.length > 0) {
    console.log('⏭️ Admin already exists, updating role...')
    await db.update(users).set({ role: 'admin' }).where(eq(users.id, existingAdmin[0].id))
    console.log('✅ Admin role updated')
    process.exit(0)
    return
  }

  const passwordHash = await hashPassword('Admin@123')
  
  await db.insert(users).values({
    id: uuidv4(),
    email,
    passwordHash,
    firstName: 'Admin',
    lastName: 'User',
    role: 'admin',
    status: 'active',
    preferredLanguage: 'zh',
  })

  console.log('✅ Admin user created')
  console.log('   Email: axis-o@qq.com')
  console.log('   Password: Admin@123')
  process.exit(0)
}

createAdmin().catch((err) => {
  console.error('❌ Failed to create admin:', err)
  process.exit(1)
})