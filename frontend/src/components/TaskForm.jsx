import { useState } from 'react';
import { getErrorMessage, getFieldErrors } from '../services/api.js';
import { ErrorAlert } from './Feedback.jsx';

const TITLE_MAX = 150;
const DESCRIPTION_MAX = 5000;

const EMPTY_TASK = {
  title: '',
  description: '',
  priority: 'MEDIUM',
  status: 'PENDING',
  due_date: '',
};

// Client-side checks give instant feedback. The backend validates again,
// because a browser can never be trusted to enforce rules on its own.
function validate(values) {
  const errors = {};
  const title = values.title.trim();
  if (!title) errors.title = 'Title is required';
  else if (title.length > TITLE_MAX) errors.title = `Title must be at most ${TITLE_MAX} characters`;
  if (values.description.length > DESCRIPTION_MAX)
    errors.description = `Description must be at most ${DESCRIPTION_MAX} characters`;
  return errors;
}

/**
 * Used for both "Add Task" and "Edit Task".
 * `onSubmit` receives the cleaned values and must return a promise.
 */
export default function TaskForm({ initialValues, submitLabel, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => ({
    ...EMPTY_TASK,
    ...initialValues,
    description: initialValues?.description ?? '',
    due_date: initialValues?.due_date ?? '',
  }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        title: values.title.trim(),
        description: values.description.trim() || null,
        priority: values.priority,
        status: values.status,
        due_date: values.due_date || null,
      });
    } catch (error) {
      // Show server-side validation errors next to the matching fields.
      setErrors(getFieldErrors(error));
      setFormError(getErrorMessage(error));
      setSubmitting(false);
    }
  }

  return (
    <form className="card form" onSubmit={handleSubmit} noValidate>
      <ErrorAlert message={formError} />

      <div className="field">
        <label htmlFor="title">
          Title <span className="required">*</span>
        </label>
        <input
          id="title"
          name="title"
          type="text"
          value={values.title}
          onChange={handleChange}
          maxLength={TITLE_MAX}
          placeholder="e.g. Configure Nginx reverse proxy"
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? 'title-error' : undefined}
          autoFocus
        />
        {errors.title && <p id="title-error" className="field__error">{errors.title}</p>}
      </div>

      <div className="field">
        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows={4}
          value={values.description}
          onChange={handleChange}
          maxLength={DESCRIPTION_MAX}
          placeholder="Optional details about the task"
          aria-invalid={Boolean(errors.description)}
        />
        {errors.description && <p className="field__error">{errors.description}</p>}
      </div>

      <div className="form__row">
        <div className="field">
          <label htmlFor="priority">Priority</label>
          <select id="priority" name="priority" value={values.priority} onChange={handleChange}>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
          </select>
          {errors.priority && <p className="field__error">{errors.priority}</p>}
        </div>

        <div className="field">
          <label htmlFor="status">Status</label>
          <select id="status" name="status" value={values.status} onChange={handleChange}>
            <option value="PENDING">Pending</option>
            <option value="COMPLETED">Completed</option>
          </select>
          {errors.status && <p className="field__error">{errors.status}</p>}
        </div>

        <div className="field">
          <label htmlFor="due_date">Due date</label>
          <input id="due_date" name="due_date" type="date" value={values.due_date} onChange={handleChange} />
          {errors.due_date && <p className="field__error">{errors.due_date}</p>}
        </div>
      </div>

      <div className="form__actions">
        <button type="button" className="btn btn--ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="btn btn--primary" disabled={submitting}>
          {submitting && <span className="spinner spinner--sm spinner--light" />}
          {submitting ? 'Saving…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
