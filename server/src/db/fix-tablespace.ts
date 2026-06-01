import mysql from 'mysql2/promise'

async function fixTablespace() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'axis_o'
  })

  try {
    console.log('Dropping existing users_temp table...')
    await connection.query('DROP TABLE IF EXISTS users_temp')
    console.log('Table dropped')

    console.log('Creating users_temp table...')
    
    await connection.query(`
      CREATE TABLE users_temp (
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
    console.log('users_temp table created')

    console.log('Creating admin user...')
    const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.default.hash('password123', 10)
    
    await connection.query(
      'INSERT INTO users_temp (id, email, password_hash, first_name, last_name, role, status, preferred_language) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      ['admin-0001', 'admin@example.com', passwordHash, 'Admin', 'User', 'super_admin', 'active', 'zh']
    )
    console.log('Admin user created: admin@example.com / password123')

    console.log('Testing login query...')
    const [users] = await connection.query('SELECT * FROM users_temp WHERE email = ?', ['admin@example.com'])
    console.log('Users found:', (users as any[]).length)

    console.log('\n✅ Fix completed!')
    console.log('Now I need to rename users_temp to users to fix the login issue.')
    
    console.log('\nAttempting to rename table...')
    await connection.query('RENAME TABLE users_temp TO users')
    console.log('✅ Table renamed successfully!')
    
  } catch (err: any) {
    console.error('❌ Failed:', err.message)
    throw err
  } finally {
    await connection.end()
  }
}

fixTablespace()