const mysql = require('mysql2/promise');
const env = require('./env');

// Create the connection pool
const pool = mysql.createPool({
  host: env.DB.host,
  port: env.DB.port,
  user: env.DB.user,
  password: env.DB.password,
  database: env.DB.name,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Function to test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('\x1b[32m%s\x1b[0m', 'MySQL Database connected successfully.');
    connection.release();
    return true;
  } catch (error) {
    console.error('\x1b[31m%s\x1b[0m', 'MySQL Database connection failed:');
    console.error(error.message);
    return false;
  }
};

module.exports = {
  pool,
  testConnection
};
