// Loads variables from backend/.env into process.env and exposes them
// as one typed config object, so the rest of the code never reads
// process.env directly.
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

// Resolve backend/.env relative to this file, so it is found no matter
// which directory the process is started from (important under PM2).
// Variables already set in the real environment take precedence.
dotenv.config({ path: fileURLToPath(new URL('../../.env', import.meta.url)), quiet: true });

const REQUIRED_VARS = ['DB_HOST', 'DB_USER', 'DB_NAME'];

const missing = REQUIRED_VARS.filter((name) => !process.env[name]);
if (missing.length > 0) {
  console.error(
    `[config] Missing required environment variables: ${missing.join(', ')}.\n` +
      '[config] Copy backend/.env.example to backend/.env and fill in the values.'
  );
  process.exit(1);
}

const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 5000,
  db: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    // An empty password is allowed (some local installs have none).
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT) || 3306,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  },
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
};

config.isProduction = config.nodeEnv === 'production';

export default config;
