// Controllers: translate HTTP requests into service calls and service
// results into HTTP responses. They contain no SQL and no validation logic.
//
// Every successful response has the same shape:
//   { success: true, message?: "...", data: ... }
//
// Express 5 automatically passes errors thrown inside async functions to
// the error handler, so no try/catch is needed here.
import * as taskService from '../services/taskService.js';

export async function getTasks(req, res) {
  const tasks = await taskService.getAllTasks(req.validated.query);
  res.json({ success: true, count: tasks.length, data: tasks });
}

export async function getTaskStats(req, res) {
  const stats = await taskService.getTaskStats();
  res.json({ success: true, data: stats });
}

export async function getTask(req, res) {
  const task = await taskService.getTaskById(req.validated.id);
  res.json({ success: true, data: task });
}

export async function createTask(req, res) {
  const task = await taskService.createTask(req.validated.body);
  res.status(201).json({ success: true, message: 'Task created successfully', data: task });
}

export async function updateTask(req, res) {
  const task = await taskService.updateTask(req.validated.id, req.validated.body);
  res.json({ success: true, message: 'Task updated successfully', data: task });
}

export async function updateTaskStatus(req, res) {
  const task = await taskService.updateTaskStatus(req.validated.id, req.validated.body.status);
  const label = task.status === 'COMPLETED' ? 'completed' : 'pending';
  res.json({ success: true, message: `Task marked as ${label}`, data: task });
}

export async function deleteTask(req, res) {
  const task = await taskService.deleteTask(req.validated.id);
  res.json({ success: true, message: 'Task deleted successfully', data: { id: task.id } });
}
