import mysql from 'mysql2/promise';

async function verifyDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'axis_o',
      port: 3306
    });
    
    console.log('[DB] Connected to axis_o database');
    
    const [tables] = await connection.execute(
      "SHOW TABLES"
    );
    
    console.log('\n[DB] Tables in axis_o database:');
    const tableRows = tables;
    tableRows.forEach((row, index) => {
      const tableName = Object.values(row)[0];
      console.log(`${index + 1}. ${tableName}`);
    });
    
    console.log(`\n[DB] ✅ Total tables: ${tableRows.length}`);
    
    await connection.end();
    
  } catch (error) {
    console.error('[DB] ❌ Failed to verify database:', error.message);
    process.exit(1);
  }
}

verifyDatabase();
