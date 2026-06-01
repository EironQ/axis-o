import { env } from '../config/env'
import mysql from 'mysql2/promise'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function runMigration() {
  console.log('[Migration] Connecting to database...')
  
  const connection = await mysql.createConnection({
    uri: env.DATABASE_URL
  })

  try {
    const migrationsDir = path.join(__dirname, 'migrations')
    const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort()

    for (const file of files) {
      console.log(`[Migration] Executing: ${file}`)
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8')
      
      const statements = sql.split(/--\s*statement-breakpoint\s*/g).filter(s => s.trim())
      
      for (const stmt of statements) {
        if (stmt.trim()) {
          try {
            await connection.execute(stmt.trim())
          } catch (err: any) {
            if (err.code === 'ER_TABLE_EXISTS_ERROR' || err.code === 'ER_DUP_KEYNAME') {
              console.log(`[Migration] Skipping existing: ${stmt.substring(0, 50)}...`)
            } else {
              throw err
            }
          }
        }
      }
      
      console.log(`[Migration] Completed: ${file}`)
    }

    console.log('[Migration] All migrations completed successfully!')
  } finally {
    await connection.end()
  }
}

runMigration().catch(err => {
  console.error('[Migration] Failed:', err)
  process.exit(1)
})