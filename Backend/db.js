import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.MYSQL_ADDON_HOST || process.env.DB_HOST || 'localhost',
  user: process.env.MYSQL_ADDON_USER || process.env.DB_USER || 'root',
  password: process.env.MYSQL_ADDON_PASSWORD || process.env.DB_PASSWORD || '',
  database: process.env.MYSQL_ADDON_DB || process.env.DB_NAME || 'mic_attendance',
  port: parseInt(process.env.MYSQL_ADDON_PORT || '3306', 10),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

// Optionally ping the database to log connection success
pool.getConnection()
  .then((connection) => {
    connection.release();
    console.log('Connected to MySQL successfully.');
  })
  .catch((err) => {
    console.error('MySQL connection error:', err.message);
  });

export default pool;
