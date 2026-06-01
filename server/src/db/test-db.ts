import mysql from 'mysql2/promise'

async function test() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    database: 'axis_o'
  })

  try {
    console.log('Testing database connection...')
    
    // Test 1: Create table
    console.log('\n1. Creating users table...')
    const createResult = await connection.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id varchar(36) NOT NULL PRIMARY KEY,
        email varchar(255) NOT NULL UNIQUE,
        password_hash varchar(255) NOT NULL,
        first_name varchar(100) NOT NULL,
        last_name varchar(100) NOT NULL,
        role enum('customer','admin','super_admin') NOT NULL DEFAULT 'customer',
        status enum('active','inactive','banned') NOT NULL DEFAULT 'active',
        created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)
    console.log('Create result:', createResult)

    // Test 2: Check if table exists
    console.log('\n2. Checking if table exists...')
    const [tables] = await connection.execute(`
      SHOW TABLES LIKE 'users'
    `)
    console.log('Tables:', tables)

    // Test 3: Try query
    console.log('\n3. Querying users table...')
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM users')
    console.log('Rows:', rows)

    console.log('\n✅ All tests passed!')
  } catch (err: any) {
    console.error('\n❌ Error:', err.message)
    console.error('Code:', err.code)
    console.error('SQL:', err.sql)
  } finally {
    await connection.end()
  }
}

test()