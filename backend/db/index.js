const { Pool } = require('pg'); // pool class from pg (postgresql) package
require('dotenv').config(); // to load db credentials from .env file for configuration

// Validate required environment variables
const requiredEnvVars = ['DB_PASSWORD', 'DB_USER', 'DB_HOST', 'DB_PORT', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// create a pool of db connections the app can use, to handle db requests
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

module.exports = {
    // other parts of the application will use this query function to interact with the database
    query: (text, params) => pool.query(text, params),
    testConnection: async () => {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('Database connected successfully:', res.rows[0]);
            return true;
        } catch (err) {
            console.error('Database connection error:', err.message);
            console.error('Current connection settings:', {
                user: process.env.DB_USER,
                host: process.env.DB_HOST,
                database: process.env.DB_NAME,
                port: process.env.DB_PORT,
                // Not logging password for security reasons
            });
            return false;
        }
    }
};