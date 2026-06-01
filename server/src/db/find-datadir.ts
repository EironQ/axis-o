import mysql from 'mysql2/promise'

async function findDataDir() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root'
  })

  try {
    const [rows] = await connection.execute("SHOW VARIABLES LIKE 'datadir'")
    console.log('Data directory:', (rows as any[])[0]?.Value)
  } finally {
    await connection.end()
  }
}

findDataDir()