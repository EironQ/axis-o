import { drizzle } from 'drizzle-orm/mysql2'
import mysql from 'mysql2/promise'
import { env } from '../config/env'

const dbUrl = env.DATABASE_URL.includes('?')
  ? `${env.DATABASE_URL}&charset=utf8mb4`
  : `${env.DATABASE_URL}?charset=utf8mb4`

const pool = mysql.createPool(dbUrl)

export const db = drizzle(pool)
export { pool }
