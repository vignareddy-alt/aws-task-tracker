// MySQL connection pool.
// A pool keeps a few connections open and reuses them, which is much
// faster and more reliable than opening a new connection per request.
import mysql from 'mysql2/promise';
import config from './env.js';

const pool = mysql.createPool({
  host: config.db.host,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  port: config.db.port,
  waitForConnections: true,
  connectionLimit: config.db.connectionLimit,
  queueLimit: 0,
  // Return DATE/TIMESTAMP columns as plain strings ("2026-01-31").
  // This avoids time-zone shifts when converting to JavaScript Date objects.
  dateStrings: true,
  // Fail fast if MySQL is unreachable instead of hanging.
  connectTimeout: 10000,
});

/**
 * Checks that the database is reachable. Used at startup and by /api/health.
 * Returns true/false instead of throwing so callers can decide what to do.
 */
export async function checkDatabaseConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    return true;
  } catch (error) {
    console.error(`[db] Connection check failed: ${error.code || error.message}`);
    return false;
  }
}

export async function closePool() {
  await pool.end();
}

export default pool;
