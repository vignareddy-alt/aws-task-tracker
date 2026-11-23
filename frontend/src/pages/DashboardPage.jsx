import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StatsCards from '../components/StatsCards.jsx';
import Toolbar from '../components/Toolbar.jsx';
import TaskList from '../components/TaskList.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import Icon from '../components/Icon.jsx';
import { Loader, ErrorAlert, EmptyState } from '../components/Feedback.jsx';
import useTasks from '../hooks/useTasks.js';
import useDebounce from '../hooks/useDebounce.js';
import useToast from '../hooks/useToast.js';
import { deleteTask, updateTaskStatus } from '../services/taskService.js';
import { getErrorMessage } from '../services/api.js';

const VALID_STATUSES = ['ALL', 'PENDING', 'COMPLETED'];

export default function DashboardPage() {
  // The status filter lives in the URL (?status=PENDING) so the sidebar
  // links and the browser back button work naturally.
  const [searchParams, setSearchParams] = useSearchParams();
  const statusParam = (searchParams.get('status') || 'ALL').toUpperCase();
  const status = VALID_STATUSES.includes(statusParam) ? statusParam : 'ALL';

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search);

  const { tasks, stats, loading, error, reload } = useTasks({ search: debouncedSearch, status });
  const toast = useToast();

  const [busyIds, setBusyIds] = useState(() => new Set());
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  function handleStatusChange(nextStatus) {
    setSearchParams(nextStatus === 'ALL' ? {} : { status: nextStatus });
  }

  function setBusy(id, isBusy) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (isBusy) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  async function handleToggleStatus(task) {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    setBusy(task.id, true);
    try {
      const result = await updateTaskStatus(task.id, nextStatus);
      toast.success(result.message);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setBusy(task.id, false);
    }
  }

  async function handleConfirmDelete() {
    setDeleting(true);
    try {
      await deleteTask(taskToDelete.id);
      toast.success(`Deleted "${taskToDelete.title}"`);
      setTaskToDelete(null);
      await reload();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  const filtersActive = debouncedSearch.trim() !== '' || status !== 'ALL';
  const heading = status === 'ALL' ? 'All tasks' : status === 'PENDING' ? 'Pending tasks' : 'Completed tasks';

  return (
    <>
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Plan, track, and finish your daily work.</p>
        </div>
        <Link to="/tasks/new" className="btn btn--primary">
          <Icon name="plus" /> Add task
        </Link>
      </div>

      <StatsCards stats={stats} loading={loading} />

      <section className="card">
        <div className="card__header">
          <h2>
            {heading}
            {!loading && !error && <span className="count-pill">{tasks.length}</span>}
          </h2>
          {loading && tasks.length > 0 && <span className="spinner spinner--sm" aria-label="Refreshing" />}
        </div>

        <Toolbar
          search={search}
          onSearchChange={setSearch}
          status={status}
          onStatusChange={handleStatusChange}
        />

        <ErrorAlert message={error} onRetry={reload} />

        {loading && tasks.length === 0 && !error ? (
          <Loader label="Loading tasks…" />
        ) : !error && tasks.length === 0 ? (
          filtersActive ? (
            <EmptyState title="No matching tasks" message="Try a different search term or status filter." />
          ) : (
            <EmptyState
              title="No tasks yet"
              message="Create your first task to get started."
              action={
                <Link to="/tasks/new" className="btn btn--primary">
                  <Icon name="plus" /> Add task
                </Link>
              }
            />
          )
        ) : (
          !error && (
            <TaskList
              tasks={tasks}
              busyIds={busyIds}
              onToggleStatus={handleToggleStatus}
              onDelete={setTaskToDelete}
            />
          )
        )}
      </section>

      <ConfirmDialog
        open={Boolean(taskToDelete)}
        title="Delete task?"
        message={taskToDelete ? `"${taskToDelete.title}" will be permanently deleted. This cannot be undone.` : ''}
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </>
  );
}
