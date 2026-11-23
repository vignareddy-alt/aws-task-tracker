// Centralized error handling.
// Every error thrown in a route (including from async code) ends up here,
// so all error responses share the same JSON shape:
//   { success: false, message: "...", errors?: {...} }
import ApiError from '../utils/ApiError.js';
import config from '../config/env.js';

// mysql2 error codes that mean "the database is unreachable or misconfigured".
const DB_CONNECTION_ERRORS = new Set([
  'ECONNREFUSED',
  'ENOTFOUND',
  'ETIMEDOUT',
  'EHOSTUNREACH',
  'PROTOCOL_CONNECTION_LOST',
  'ER_ACCESS_DENIED_ERROR',
  'ER_BAD_DB_ERROR',
  'ER_CON_COUNT_ERROR',
]);

/** Handles requests to routes that do not exist. */
export function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

// Express recognizes error handlers by their 4 arguments, so `next` must stay.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  let statusCode = 500;
  let message = 'Something went wrong on the server';
  let errors;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    errors = err.details;
  } else if (err.type === 'entity.parse.failed') {
    // Thrown by express.json() when the body is not valid JSON.
    statusCode = 400;
    message = 'Request body contains invalid JSON';
  } else if (err.type === 'entity.too.large') {
    statusCode = 413;
    message = 'Request body is too large';
  } else if (DB_CONNECTION_ERRORS.has(err.code)) {
    statusCode = 503;
    message = 'Database is unavailable. Please try again later.';
  } else if (err.code === 'ER_DATA_TOO_LONG') {
    statusCode = 400;
    message = 'One of the fields is too long';
  }

  // Log full details for server errors; client errors are expected traffic.
  if (statusCode >= 500) {
    console.error(`[error] ${req.method} ${req.originalUrl}:`, err.code || '', err.message);
    if (!config.isProduction) console.error(err.stack);
  }

  const body = { success: false, message };
  if (errors) body.errors = errors;
  // Expose raw error text only in development to help debugging.
  if (!config.isProduction && statusCode >= 500) body.debug = err.code || err.message;

  res.status(statusCode).json(body);
}
