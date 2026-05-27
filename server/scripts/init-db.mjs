import fs from 'fs';
import mysql from 'mysql2/promise';

async function initializeDatabase() {
  const sqlFilePath = './src/db/init-db.sql';
  
  try {
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      port: 3306
    });
    
    console.log('[DB] Connected to MySQL server');
    
    const sqlStatements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    for (let i = 0; i < sqlStatements.length; i++) {
      const stmt = sqlStatements[i];
      try {
        await connection.execute(stmt);
        console.log(`[DB] Executed statement ${i + 1}/${sqlStatements.length}`);
      } catch (err) {
        if (err.code === 'ER_DB_CREATE_EXISTS' || err.code === 'ER_TABLE_EXISTS_ERROR') {
          console.log(`[DB] Skipping existing: ${err.message.split('\n')[0]}`);
        } else {
          console.log(`[DB] Warning: ${err.message.split('\n')[0]}`);
        }
      }
    }
    
    await connection.end();
    console.log('\n[DB] ✅ Database initialized successfully!');
    
  } catch (error) {
    console.error('[DB] ❌ Failed to initialize database:', error.message);
    process.exit(1);
  }
}

initializeDatabase();
