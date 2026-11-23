// Input validation middleware.
// Each validator checks the incoming request, collects every problem it
// finds, and either responds 400 (via ApiError) or stores the cleaned-up
// values on req.validated for the controller to use.
import ApiError from '../utils/ApiError.js';
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  TITLE_MAX_LENGTH,
  DESCRIPTION_MAX_LENGTH,
  SEARCH_MAX_LENGTH,
} from '../utils/constants.js';

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_UNSIGNED_INT = 4294967295;

// "2026-02-30" matches the pattern but is not a real date; this catches it.
function isRealDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function setValidated(req, key, value) {
  req.validated = { ...(req.validated || {}), [key]: value };
}

/**
 * Validates the body of a create/update request.
 * @param {object} body       raw request body
 * @param {boolean} titleRequired
 * @returns {{ errors: object, data: object }}
 */
function checkTaskBody(body, titleRequired) {
  const errors = {};
  const data = {};

  if (body === null || typeof body !== 'object' || Array.isArray(body)) {
    return { errors: { body: 'Request body must be a JSON object' }, data };
  }

  // title
  if (body.title === undefined || body.title === null) {
    if (titleRequired) errors.title = 'Title is required';
  } else if (typeof body.title !== 'string') {
    errors.title = 'Title must be a string';
  } else {
    const title = body.title.trim();
    if (!title) errors.title = 'Title cannot be empty';
    else if (title.length > TITLE_MAX_LENGTH)
      errors.title = `Title must be at most ${TITLE_MAX_LENGTH} characters`;
    else data.title = title;
  }

  // description (optional; empty string or null clears it)
  if (body.description !== undefined) {
    if (body.description === null || body.description === '') {
      data.description = null;
    } else if (typeof body.description !== 'string') {
      errors.description = 'Description must be a string';
    } else if (body.description.length > DESCRIPTION_MAX_LENGTH) {
      errors.description = `Description must be at most ${DESCRIPTION_MAX_LENGTH} characters`;
    } else {
      data.description = body.description.trim() || null;
    }
  }

  // status (optional)
  if (body.status !== undefined) {
    const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : body.status;
    if (!TASK_STATUSES.includes(status)) {
      errors.status = `Status must be one of: ${TASK_STATUSES.join(', ')}`;
    } else {
      data.status = status;
    }
  }

  // priority (optional)
  if (body.priority !== undefined) {
    const priority =
      typeof body.priority === 'string' ? body.priority.trim().toUpperCase() : body.priority;
    if (!TASK_PRIORITIES.includes(priority)) {
      errors.priority = `Priority must be one of: ${TASK_PRIORITIES.join(', ')}`;
    } else {
      data.priority = priority;
    }
  }

  // due_date (optional; empty string or null clears it)
  if (body.due_date !== undefined) {
    if (body.due_date === null || body.due_date === '') {
      data.due_date = null;
    } else if (typeof body.due_date !== 'string' || !isRealDate(body.due_date)) {
      errors.due_date = 'Due date must be a valid date in YYYY-MM-DD format';
    } else {
      data.due_date = body.due_date;
    }
  }

  return { errors, data };
}

function throwIfErrors(errors) {
  if (Object.keys(errors).length > 0) {
    throw ApiError.badRequest('Validation failed', errors);
  }
}

/** Ensures :id is a positive whole number. */
export function validateTaskId(req, res, next) {
  const { id } = req.params;
  const numericId = Number(id);

  if (!/^\d+$/.test(id) || numericId < 1 || numericId > MAX_UNSIGNED_INT) {
    throw ApiError.badRequest('Invalid task id. It must be a positive whole number.', {
      id: `Received "${id}"`,
    });
  }

  setValidated(req, 'id', numericId);
  next();
}

/** POST /api/tasks */
export function validateCreateTask(req, res, next) {
  const { errors, data } = checkTaskBody(req.body, true);
  throwIfErrors(errors);
  setValidated(req, 'body', data);
  next();
}

/** PUT /api/tasks/:id - title required, other fields optional. */
export function validateUpdateTask(req, res, next) {
  const { errors, data } = checkTaskBody(req.body, true);
  throwIfErrors(errors);
  setValidated(req, 'body', data);
  next();
}

/** PATCH /api/tasks/:id/status */
export function validateStatusUpdate(req, res, next) {
  const raw = req.body?.status;
  const status = typeof raw === 'string' ? raw.trim().toUpperCase() : raw;

  if (!TASK_STATUSES.includes(status)) {
    throw ApiError.badRequest('Validation failed', {
      status: `Status is required and must be one of: ${TASK_STATUSES.join(', ')}`,
    });
  }

  setValidated(req, 'body', { status });
  next();
}

/** GET /api/tasks?search=...&status=... */
export function validateTaskQuery(req, res, next) {
  const errors = {};
  const query = {};
  const { search, status } = req.query;

  if (search !== undefined) {
    if (typeof search !== 'string') {
      errors.search = 'Search must be a single text value';
    } else if (search.trim().length > SEARCH_MAX_LENGTH) {
      errors.search = `Search must be at most ${SEARCH_MAX_LENGTH} characters`;
    } else if (search.trim()) {
      query.search = search.trim();
    }
  }

  if (status !== undefined && status !== '') {
    const normalized = typeof status === 'string' ? status.trim().toUpperCase() : status;
    if (normalized === 'ALL') {
      // "ALL" means no status filter
    } else if (!TASK_STATUSES.includes(normalized)) {
      errors.status = `Status filter must be one of: ALL, ${TASK_STATUSES.join(', ')}`;
    } else {
      query.status = normalized;
    }
  }

  throwIfErrors(errors);
  setValidated(req, 'query', query);
  next();
}
