// All task-related API calls. Components call these functions instead of
// using Axios directly, which keeps endpoint paths in a single file.
import api from './api.js';

export async function fetchTasks({ search = '', status = 'ALL' } = {}, signal) {
  const params = {};
  if (search.trim()) params.search = search.trim();
  if (status && status !== 'ALL') params.status = status;
  const { data } = await api.get('/tasks', { params, signal });
  return data.data;
}

export async function fetchTaskStats(signal) {
  const { data } = await api.get('/tasks/stats', { signal });
  return data.data;
}

export async function fetchTask(id, signal) {
  const { data } = await api.get(`/tasks/${id}`, { signal });
  return data.data;
}

export async function createTask(task) {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(id, task) {
  const { data } = await api.put(`/tasks/${id}`, task);
  return data;
}

export async function updateTaskStatus(id, status) {
  const { data } = await api.patch(`/tasks/${id}/status`, { status });
  return data;
}

export async function deleteTask(id) {
  const { data } = await api.delete(`/tasks/${id}`);
  return data;
}
