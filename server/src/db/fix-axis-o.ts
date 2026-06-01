import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import fs from 'fs'
import path from 'path'

async function fixAxisO() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root'
  })

  try {
    console.log('=== 修复 axis_o 数据库 ===\n')

    // Step 1: 从 axis_o_new 导出用户数据
    console.log('1. 从 axis_o_new 导出用户数据...')
    await connection.query('USE axis_o_new')
    const [users] = await connection.query('SELECT * FROM users')
    console.log(`   找到 ${(users as any[]).length} 个用户`)
    
    // Step 2: 删除损坏的 axis_o 数据库
    console.log('\n2. 删除损坏的 axis_o 数据库...')
    try {
      await connection.query('DROP DATABASE IF EXISTS axis_o')
      console.log('   数据库已删除')
    } catch (err: any) {
      console.log(`   警告: ${err.message}`)
      console.log('   尝试手动清理...')
    }

    // Step 3: 重新创建 axis_o 数据库
    console.log('\n3. 重新创建 axis_o 数据库...')
    await connection.query('CREATE DATABASE axis_o CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci')
    console.log('   数据库已创建')

    // Step 4: 创建 users 表
    console.log('\n4. 创建 users 表...')
    await connection.query('USE axis_o')
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
    console.log('   users 表已创建')

    // Step 5: 导入用户数据
    console.log('\n5. 导入用户数据...')
    for (const user of users as any[]) {
      await connection.query(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, avatar_url, role, status, preferred_language, preferred_currency, last_login_at, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.email, user.password_hash, user.first_name, user.last_name, user.phone, user.avatar_url, user.role, user.status, user.preferred_language, user.preferred_currency, user.last_login_at, user.created_at, user.updated_at]
      )
    }
    console.log(`   已导入 ${(users as any[]).length} 个用户`)

    // Step 6: 验证
    console.log('\n6. 验证数据...')
    const [newUsers] = await connection.query('SELECT * FROM users WHERE email = ?', ['admin@example.com'])
    console.log(`   管理员用户: ${(newUsers as any[]).length > 0 ? '✅ 存在' : '❌ 不存在'}`)

    console.log('\n=== 修复完成 ===')
    console.log('axis_o 数据库已修复，现在可以更新 .env 文件使用 axis_o')
    
  } catch (err: any) {
    console.error('\n❌ 失败:', err.message)
    throw err
  } finally {
    await connection.end()
  }
}

fixAxisO()