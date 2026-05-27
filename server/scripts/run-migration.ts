import { env } from '../src/config/env'
import mysql from 'mysql2/promise'
import fs from 'fs'
import { fileURLToPath, URL } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  const connection = await mysql.createConnection(env.DATABASE_URL)
  
  try {
    const sqlPath = path.join(__dirname, '../src/db/migrations/0003_returns_exchange.sql')
    const sqlContent = fs.readFileSync(sqlPath, 'utf-8')
    
    const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(s => s)
    
    for (const statement of statements) {
      await connection.execute(statement)
      console.log('Executed:', statement.substring(0, 50) + (statement.length > 50 ? '...' : ''))
    }
    
    console.log('\n✅ Migration completed successfully!')
  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await connection.end()
  }
}

runMigration()
