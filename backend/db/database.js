// const { Pool } = require('pg');

// const isTest = process.env.NODE_ENV === 'test';

// const pool = new Pool({
//   host: process.env.DB_HOST,
//   port: process.env.DB_PORT,
//   database: isTest ? process.env.TEST_DB_NAME : process.env.DB_NAME,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD
// });

// module.exports = {
//   query: (text, params) => pool.query(text, params),
//   pool
// };