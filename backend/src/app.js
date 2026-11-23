// Builds and configures the Express application (but does not start it).
// Keeping this separate from server.js makes the app easy to test.
import express from 'express';
import cors from 'cors';
import config from './config/env.js';
import apiRoutes from './routes/index.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';

const app = express();

// Behind Nginx, trust the X-Forwarded-* headers so req.ip etc. are correct.
app.set('trust proxy', 1);
// Do not advertise the framework in response headers.
app.disable('x-powered-by');

app.use(
  cors({
    origin(origin, callback) {
      // Requests with no Origin header (curl, Postman, same-origin via Nginx)
      // are always allowed. Browser requests must come from an allowed origin.
      if (!origin || config.corsOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
  })
);

// Parse JSON request bodies (rejects bodies larger than 100kb).
app.use(express.json({ limit: '100kb' }));

// Simple request logger for development.
if (!config.isProduction) {
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
    });
    next();
  });
}

app.use('/api', apiRoutes);

// Must be registered after all routes.
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
