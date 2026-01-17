const { Pool } = require('pg');

// Create a connection pool using environment variables
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Test the connection when the app starts
pool.on('connect', () => {
  // console.log('Connected to the Database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};