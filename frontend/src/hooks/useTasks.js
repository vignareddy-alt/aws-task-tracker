import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchTasks, fetchTaskStats } from '../services/taskService.js';
import { getErrorMessage } from '../services/api.js';

const EMPTY_STATS = { total: 0, completed: 0, pending: 0 };

/**
 * Loads the task list (filtered by search/status) and the summary counts.
 * Whenever the filters change, the previous request is cancelled so a
 * slow old response can never overwrite a newer one.
 */
export default function useTasks({ search, status }) {
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const controllerRef = useRef(null);

  const load = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    setLoading(true);
    setError('');
    try {
      const [taskList, taskStats] = await Promise.all([
        fetchTasks({ search, status }, controller.signal),
        fetchTaskStats(controller.signal),
      ]);
      setTasks(taskList);
      setStats(taskStats);
    } catch (err) {
      const message = getErrorMessage(err);
      if (message) setError(message); // null means the request was cancelled
    } finally {
      if (controllerRef.current === controller) setLoading(false);
    }
  }, [search, status]);

  useEffect(() => {
    load();
    return () => controllerRef.current?.abort();
  }, [load]);

  return { tasks, stats, loading, error, reload: load };
}
