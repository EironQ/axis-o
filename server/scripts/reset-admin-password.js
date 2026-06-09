const bcrypt = require('bcrypt');
const { db } = require('../dist/server/src/config/database');
const { users } = require('../dist/server/src/db/schema');
const { eq } = require('drizzle-orm');

async function resetAdminPassword() {
  try {
    const adminEmail = 'admin@axiso.com';
    const newPassword = 'password';
    
    const existingAdmin = await db.select().from(users).where(eq(users.email, adminEmail)).limit(1);
    
    if (existingAdmin.length === 0) {
      console.log('Admin user not found, creating new admin...');
      
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      const adminId = require('uuid').v4();
      
      await db.insert(users).values({
        id: adminId,
        email: adminEmail,
        passwordHash: passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        role: 'super_admin',
        status: 'active',
        preferredLanguage: 'zh',
        preferredCurrency: 'CNY',
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      
      console.log('Admin user created successfully!');
    } else {
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      await db.update(users)
        .set({ passwordHash: passwordHash, updatedAt: new Date() })
        .where(eq(users.email, adminEmail));
      
      console.log('Admin password reset successfully!');
    }
    
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${newPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Error resetting admin password:', error);
    process.exit(1);
  }
}

resetAdminPassword();