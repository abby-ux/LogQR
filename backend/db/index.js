const { Pool } = require('pg');
require('dotenv').config();


// Create the configuration object with proper validation
const createConfig = () => {
    // We'll use environment variables with fallbacks for safety
    const config = {
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'logreview_db',
        password: process.env.DB_PASSWORD,
        port: process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432
    };

    // Add validation to prevent using port as host
    if (config.host === '5432' || config.host === 5432) {
        console.log('Correcting invalid host configuration');
        config.host = 'localhost';
    }

    return config;
};

// Initialize the pool with our validated configuration
const pool = new Pool(createConfig());

// Export both the pool and our helper functions
module.exports = {
    query: (text, params) => pool.query(text, params),
    pool, // Now we're explicitly exporting the pool
    testConnection: async () => {
        try {
            const res = await pool.query('SELECT NOW()');
            console.log('Database connected successfully:', res.rows[0]);
        } catch (err) {
            console.error('Database connection error:', err);
            console.error('Connection attempted with:', {
                user: pool.options.user,
                host: pool.options.host,
                database: pool.options.database,
                port: pool.options.port
            });
        }
    }
};