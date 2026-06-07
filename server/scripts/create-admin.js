const bcrypt = require('bcrypt');
const { db } = require('../dist/server/src/config/database');
const { users } = require('../dist/server/src/db/schema');

async function createAdmin() {
  try {
    const adminEmail = 'axis-o@qq.com';
    const adminPassword = 'password';
    
    const existingAdmin = await db.select().from(users).where({ email: adminEmail }).limit(1);
    
    if (existingAdmin.length > 0) {
      console.log('Admin user already exists');
      process.exit(0);
    }
    
    const passwordHash = await bcrypt.hash(adminPassword, 10);
    
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
    console.log(`Email: ${adminEmail}`);
    console.log(`Password: ${adminPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

createAdmin();