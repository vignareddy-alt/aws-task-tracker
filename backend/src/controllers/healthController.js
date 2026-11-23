import { checkDatabaseConnection } from '../config/db.js';

// GET /api/health
// Returns 200 when the API and database are both up, 503 when the database
// is down. Load balancers, Nginx checks, and you can call this to verify
// a deployment.
export async function getHealth(req, res) {
  const databaseUp = await checkDatabaseConnection();
  const statusCode = databaseUp ? 200 : 503;

  res.status(statusCode).json({
    success: databaseUp,
    message: databaseUp ? 'API is healthy' : 'API is running but the database is unreachable',
    data: {
      api: 'up',
      database: databaseUp ? 'up' : 'down',
      uptimeSeconds: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
    },
  });
}
