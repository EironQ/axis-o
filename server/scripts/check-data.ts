import { env } from '../src/config/env'
import mysql from 'mysql2/promise'

async function checkData() {
  const connection = await mysql.createConnection(env.DATABASE_URL)
  
  try {
    const [orders] = await connection.execute('SELECT id FROM orders LIMIT 5')
    console.log('Orders:', JSON.stringify(orders))
    
    const [orderItems] = await connection.execute('SELECT id, order_id, product_id FROM order_items LIMIT 10')
    console.log('Order Items:', JSON.stringify(orderItems))
    
    const [users] = await connection.execute('SELECT id FROM users LIMIT 5')
    console.log('Users:', JSON.stringify(users))
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await connection.end()
  }
}

checkData()
