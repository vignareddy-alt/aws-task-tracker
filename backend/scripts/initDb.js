// Creates the database and tables by running database/schema.sql with the
// credentials from backend/.env. Safe to run more than once (IF NOT EXISTS).
//   npm run db:init
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import mysql from 'mysql2/promise';
import config from '../src/config/env.js';

const schemaPath = fileURLToPath(new URL('../../database/schema.sql', import.meta.url));

async function init() {
  const sql = await readFile(schemaPath, 'utf8');

  // Connect without selecting a database, because it may not exist yet.
  const connection = await mysql.createConnection({
    host: config.db.host,
    user: config.db.user,
    password: config.db.password,
    port: config.db.port,
    multipleStatements: true,
  });

  try {
    await connection.query(sql);
    const [tables] = await connection.query(`SHOW TABLES FROM \`${config.db.database}\``);
    console.log(`[db:init] Schema applied. Tables in ${config.db.database}:`, tables.map((t) => Object.values(t)[0]).join(', '));
  } finally {
    await connection.end();
  }
}

init().catch((error) => {
  console.error(`[db:init] Failed: ${error.code || ''} ${error.message}`);
  process.exit(1);
});
