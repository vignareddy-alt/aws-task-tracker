// Service layer: the only place that talks to the database.
// Every query uses "?" placeholders. mysql2 sends the values separately
// from the SQL text, so user input can never change the query itself
// (this is what prevents SQL injection).
import pool from '../config/db.js';
import ApiError from '../utils/ApiError.js';

const TASK_COLUMNS =
  'id, title, description, status, priority, due_date, created_at, updated_at';

// Escape LIKE wildcards so searching for "50%" matches the literal text.
function escapeLike(value) {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Returns tasks, optionally filtered by a title search and/or status.
 * @param {{ search?: string, status?: string }} filters
 */
export async function getAllTasks({ search, status } = {}) {
  const conditions = [];
  const params = [];

  if (search) {
    conditions.push('title LIKE ?');
    params.push(`%${escapeLike(search)}%`);
  }

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [rows] = await pool.execute(
    `SELECT ${TASK_COLUMNS} FROM tasks ${whereClause} ORDER BY created_at DESC, id DESC`,
    params
  );
  return rows;
}

/** Returns total / completed / pending counts across all tasks. */
export async function getTaskStats() {
  const [rows] = await pool.execute(
    `SELECT
       COUNT(*) AS total,
       COALESCE(SUM(status = 'COMPLETED'), 0) AS completed,
       COALESCE(SUM(status = 'PENDING'), 0) AS pending
     FROM tasks`
  );
  const { total, completed, pending } = rows[0];
  // SUM() comes back as a string from MySQL, so convert to numbers.
  return {
    total: Number(total),
    completed: Number(completed),
    pending: Number(pending),
  };
}

/** Returns one task or throws a 404 ApiError. */
export async function getTaskById(id) {
  const [rows] = await pool.execute(`SELECT ${TASK_COLUMNS} FROM tasks WHERE id = ?`, [id]);
  if (rows.length === 0) {
    throw ApiError.notFound(`Task with id ${id} was not found`);
  }
  return rows[0];
}

/** Inserts a new task and returns the saved row. */
export async function createTask({ title, description, status, priority, due_date }) {
  const [result] = await pool.execute(
    `INSERT INTO tasks (title, description, status, priority, due_date)
     VALUES (?, ?, ?, ?, ?)`,
    [title, description ?? null, status ?? 'PENDING', priority ?? 'MEDIUM', due_date ?? null]
  );
  return getTaskById(result.insertId);
}

/**
 * Updates a task. Fields that are not provided keep their current value,
 * so the client can send only what changed (title is always required by
 * the validator for PUT).
 */
export async function updateTask(id, changes) {
  const existing = await getTaskById(id); // throws 404 if missing

  const merged = {
    title: changes.title ?? existing.title,
    description: changes.description !== undefined ? changes.description : existing.description,
    status: changes.status ?? existing.status,
    priority: changes.priority ?? existing.priority,
    due_date: changes.due_date !== undefined ? changes.due_date : existing.due_date,
  };

  await pool.execute(
    `UPDATE tasks
       SET title = ?, description = ?, status = ?, priority = ?, due_date = ?
     WHERE id = ?`,
    [merged.title, merged.description, merged.status, merged.priority, merged.due_date, id]
  );

  return getTaskById(id);
}

/** Changes only the status column. */
export async function updateTaskStatus(id, status) {
  const [result] = await pool.execute('UPDATE tasks SET status = ? WHERE id = ?', [status, id]);
  if (result.affectedRows === 0) {
    throw ApiError.notFound(`Task with id ${id} was not found`);
  }
  return getTaskById(id);
}

/** Deletes a task and returns the deleted row (handy for UI messages). */
export async function deleteTask(id) {
  const task = await getTaskById(id); // throws 404 if missing
  await pool.execute('DELETE FROM tasks WHERE id = ?', [id]);
  return task;
}
