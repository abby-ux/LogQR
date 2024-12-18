const { Pool } = require('pg');
require('dotenv').config();


const isTest = process.env.NODE_ENV === 'test';

console.log('Database Configuration (without sensitive data):', {
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    // We intentionally don't log the password for security
});

const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'logreview_db',
    password: process.env.DB_PASSWORD, 
    port: process.env.DB_PORT || 5432,
    // Add some connection handling parameters
    connectionTimeoutMillis: 5000,  // How long to wait for connection
    idleTimeoutMillis: 30000       // How long a client is allowed to remain idle
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool,  // Export the pool directly
    testConnection: async () => {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('Database connected:', res.rows[0]);
        } catch (err) {
            console.error('Database connection error:', err);
        }
    }
};