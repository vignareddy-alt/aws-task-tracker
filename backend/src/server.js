// Entry point: checks the database, starts the HTTP server, and shuts
// down cleanly when PM2 (or Ctrl+C) asks the process to stop.
import app from './app.js';
import config from './config/env.js';
import { checkDatabaseConnection, closePool } from './config/db.js';

async function start() {
  const databaseUp = await checkDatabaseConnection();
  if (databaseUp) {
    console.log(`[db] Connected to MySQL at ${config.db.host}:${config.db.port}/${config.db.database}`);
  } else {
    // We still start the server so /api/health can report the problem.
    // Task endpoints will return 503 until MySQL becomes reachable;
    // the pool reconnects automatically.
    console.warn('[db] WARNING: MySQL is not reachable. Check DB_* values in backend/.env.');
  }

  // In Express 5 this callback runs on success AND on failure (with an
  // error argument), so we must check for the error before logging success.
  const server = app.listen(config.port, (error) => {
    if (error) {
      if (error.code === 'EADDRINUSE') {
        console.error(
          `[server] Port ${config.port} is already in use (another backend may still be running). ` +
            'Stop that process or change PORT in backend/.env.'
        );
      } else {
        console.error('[server] Failed to start:', error.message);
      }
      process.exit(1);
    }
    console.log(`[server] API listening on http://localhost:${config.port}/api (${config.nodeEnv})`);
  });

  const shutdown = (signal) => {
    console.log(`[server] ${signal} received, shutting down...`);
    server.close(async () => {
      await closePool().catch(() => {});
      console.log('[server] Closed cleanly.');
      process.exit(0);
    });
    // Force exit if connections do not close within 10 seconds.
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

process.on('unhandledRejection', (reason) => {
  console.error('[server] Unhandled promise rejection:', reason);
});

start();
