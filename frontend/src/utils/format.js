// Date helpers. The API returns dates as plain strings:
//   due_date:   "2026-12-31"
//   created_at: "2026-11-23 06:59:45"
// We parse them manually so the browser's time zone never shifts the day.

function parseDateOnly(value) {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function formatDate(value) {
  const date = parseDateOnly(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

export function formatDateTime(value) {
  if (!value) return '—';
  const [datePart, timePart = '00:00:00'] = value.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hours, minutes] = timePart.split(':').map(Number);
  const date = new Date(year, month - 1, day, hours, minutes);
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/** True when a pending task's due date is before today. */
export function isOverdue(task) {
  if (task.status === 'COMPLETED' || !task.due_date) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return parseDateOnly(task.due_date) < today;
}
