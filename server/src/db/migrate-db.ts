import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'

async function migrateDb() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root'
  })

  try {
    console.log('Creating new database axis_o_new...')
    await connection.query('CREATE DATABASE IF NOT EXISTS axis_o_new CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    console.log('Database created')

    console.log('Using new database...')
    await connection.query('USE axis_o_new')

    console.log('Creating users table in new database...')
    await connection.query(`
      CREATE TABLE users (
        id varchar(36) NOT NULL PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        phone varchar(30),
        avatar_url varchar(500),
        role enum('customer','admin','super_admin') NOT NULL DEFAULT 'customer',
        status enum('active','inactive','banned') NOT NULL DEFAULT 'active',
        preferred_language enum('en','zh') NOT NULL DEFAULT 'en',
        preferred_currency varchar(5) NOT NULL DEFAULT 'USD',
        last_login_at datetime,
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_users_email (email),
        INDEX idx_users_role (role)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    console.log('Users table created')

    console.log('Creating admin user...')
    const passwordHash = await bcrypt.hash('password123', 10)
    await connection.query(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, preferred_language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['admin-0001', 'admin@example.com', passwordHash, 'Admin', 'User', 'super_admin', 'active', 'zh']
    )
    console.log('Admin user created: admin@example.com / password123')

    console.log('Testing login query...')
    const [users] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@example.com'])
    console.log('Users found:', (users as any[]).length)

    console.log('\n✅ New database created successfully!')
    console.log('Now you need to update your .env file to use axis_o_new instead of axis_o')
    
  } catch (err: any) {
    console.error('❌ Failed:', err.message)
    throw err
  } finally {
    await connection.end()
  }
}

migrateDb()