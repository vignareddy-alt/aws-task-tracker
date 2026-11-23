import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import Icon from '../components/Icon.jsx';
import ConfirmDialog from '../components/ConfirmDialog.jsx';
import { PriorityBadge, StatusBadge } from '../components/Badges.jsx';
import { Loader, ErrorAlert } from '../components/Feedback.jsx';
import useToast from '../hooks/useToast.js';
import { deleteTask, fetchTask, updateTaskStatus } from '../services/taskService.js';
import { getErrorMessage } from '../services/api.js';
import { formatDate, formatDateTime, isOverdue } from '../utils/format.js';

export default function TaskDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(
    async (signal) => {
      setLoading(true);
      setError('');
      try {
        setTask(await fetchTask(id, signal));
      } catch (err) {
        const message = getErrorMessage(err);
        if (message) setError(message);
      } finally {
        if (!signal?.aborted) setLoading(false);
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  async function handleToggleStatus() {
    setUpdating(true);
    try {
      const next = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
      const result = await updateTaskStatus(task.id, next);
      setTask(result.data);
      toast.success(result.message);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdating(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteTask(task.id);
      toast.success(`Deleted "${task.title}"`);
      navigate('/');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  const completed = task?.status === 'COMPLETED';

  return (
    <>
      <Link to="/" className="back-link">
        <Icon name="arrowLeft" size={16} /> Back to dashboard
      </Link>

      {loading && <Loader label="Loading task…" />}
      {!loading && error && <ErrorAlert message={error} onRetry={() => load()} />}

      {!loading && task && (
        <article className="card details">
          <div className="details__header">
            <div>
              <div className="details__badges">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                {isOverdue(task) && <span className="overdue-tag">Overdue</span>}
              </div>
              <h1 className={`details__title ${completed ? 'is-done' : ''}`}>{task.title}</h1>
            </div>
            <div className="details__actions">
              <button type="button" className="btn btn--ghost" onClick={handleToggleStatus} disabled={updating}>
                {updating ? <span className="spinner spinner--sm" /> : <Icon name={completed ? 'undo' : 'check'} />}
                {completed ? 'Mark as pending' : 'Mark as completed'}
              </button>
              <Link to={`/tasks/${task.id}/edit`} className="btn btn--ghost">
                <Icon name="edit" /> Edit
              </Link>
              <button type="button" className="btn btn--danger-ghost" onClick={() => setConfirmOpen(true)}>
                <Icon name="trash" /> Delete
              </button>
            </div>
          </div>

          <section className="details__section">
            <h2>Description</h2>
            {task.description ? (
              <p className="details__description">{task.description}</p>
            ) : (
              <p className="muted">No description provided.</p>
            )}
          </section>

          <dl className="details__meta">
            <div>
              <dt>Due date</dt>
              <dd>{formatDate(task.due_date)}</dd>
            </div>
            <div>
              <dt>Created</dt>
              <dd>{formatDateTime(task.created_at)}</dd>
            </div>
            <div>
              <dt>Last updated</dt>
              <dd>{formatDateTime(task.updated_at)}</dd>
            </div>
            <div>
              <dt>Task ID</dt>
              <dd>#{task.id}</dd>
            </div>
          </dl>
        </article>
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Delete task?"
        message={task ? `"${task.title}" will be permanently deleted. This cannot be undone.` : ''}
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />
    </>
  );
}
