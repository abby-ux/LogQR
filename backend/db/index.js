const { Pool } = require('pg');
require('dotenv').config();


const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME
});

const testConnection = async () => {
  try {
    const client = await pool.connect();
    console.log('Database connected successfully!');
    client.release();
  } catch (err) {
    console.error('Database connection error:', err);
    // Log more details about the error
    console.error('Error details:', {
      code: err.code,
      message: err.message,
      stack: err.stack
    });
  }
};

module.exports = {
  query: (text, params) => pool.query(text, params),
  testConnection
};