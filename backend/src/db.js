import pg from 'pg';
const { Pool, types } = pg;
// Return NUMERIC columns as JS numbers (safe for our ranges) instead of strings.
types.setTypeParser(types.builtins.NUMERIC, (value) => parseFloat(value));
const pool = new Pool(
  process.env.DATABASE_URL ? { connectionString: process.env.DATABASE_URL } : {});
pool.on('error', (err) => {
  console.error('Unexpected PostgreSQL client error:', err.message);
});
export const query = (text, params) => pool.query(text, params);

export const closePool = () => pool.end();
