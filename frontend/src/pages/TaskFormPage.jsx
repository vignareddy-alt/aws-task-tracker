import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import TaskForm from '../components/TaskForm.jsx';
import Icon from '../components/Icon.jsx';
import { Loader, ErrorAlert } from '../components/Feedback.jsx';
import useToast from '../hooks/useToast.js';
import { createTask, fetchTask, updateTask } from '../services/taskService.js';
import { getErrorMessage } from '../services/api.js';

// Handles both /tasks/new (create) and /tasks/:id/edit (update).
export default function TaskFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return undefined;
    const controller = new AbortController();
    setLoading(true);
    setError('');
    fetchTask(id, controller.signal)
      .then(setTask)
      .catch((err) => {
        const message = getErrorMessage(err);
        if (message) setError(message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [id, isEdit]);

  async function handleSubmit(values) {
    // Errors thrown here are caught and displayed by TaskForm.
    const result = isEdit ? await updateTask(id, values) : await createTask(values);
    toast.success(result.message);
    navigate(`/tasks/${result.data.id}`);
  }

  function handleCancel() {
    navigate(isEdit ? `/tasks/${id}` : '/');
  }

  return (
    <>
      <Link to={isEdit ? `/tasks/${id}` : '/'} className="back-link">
        <Icon name="arrowLeft" size={16} /> Back
      </Link>
      <div className="page-header">
        <div>
          <h1>{isEdit ? 'Edit task' : 'Add a new task'}</h1>
          <p className="muted">
            {isEdit ? 'Update the details and save your changes.' : 'Fill in the details below. Only the title is required.'}
          </p>
        </div>
      </div>

      {loading && <Loader label="Loading task…" />}
      <ErrorAlert message={error} />

      {!loading && !error && (!isEdit || task) && (
        <TaskForm
          key={task?.id ?? 'new'}
          initialValues={task ?? undefined}
          submitLabel={isEdit ? 'Save changes' : 'Create task'}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
        />
      )}
    </>
  );
}
