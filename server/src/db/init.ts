import mysql from 'mysql2/promise'

async function init() {
  console.log('[Init] Connecting to MySQL server...')
  
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root'
  })

  try {
    console.log('[Init] Dropping database axis_o...')
    await connection.execute('DROP DATABASE IF EXISTS axis_o')
    console.log('[Init] Database dropped')

    console.log('[Init] Creating database axis_o...')
    await connection.execute('CREATE DATABASE axis_o CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    console.log('[Init] Database created')

    console.log('[Init] Using database axis_o...')
    await connection.execute('USE axis_o')

    console.log('[Init] Creating users table...')
    await connection.execute(`
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
    console.log('[Init] Users table created')

    console.log('[Init] Creating admin user...')
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash('password123', 10)
    
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, first_name, last_name, role, status, preferred_language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['admin-0001', 'admin@example.com', passwordHash, 'Admin', 'User', 'super_admin', 'active', 'zh']
    )
    console.log('[Init] Admin user created: admin@example.com / password123')

    console.log('[Init] Verifying user...')
    const [users] = await connection.execute('SELECT * FROM users WHERE email = ?', ['admin@example.com'])
    console.log('[Init] Users found:', (users as any[]).length)

    console.log('[Init] Database initialization complete!')
  } catch (err: any) {
    console.error('[Init] Failed:', err.message)
    console.error('Code:', err.code)
    console.error('SQL:', err.sql)
    throw err
  } finally {
    await connection.end()
  }
}

init().catch(err => {
  console.error('[Init] Final error:', err)
  process.exit(1)
})