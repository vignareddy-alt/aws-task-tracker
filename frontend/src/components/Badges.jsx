// Small coloured labels for priority and status.
export function PriorityBadge({ priority }) {
  return (
    <span className={`badge badge--${priority.toLowerCase()}`}>
      <span className="badge__dot" aria-hidden="true" />
      {priority.charAt(0) + priority.slice(1).toLowerCase()}
    </span>
  );
}

export function StatusBadge({ status }) {
  const completed = status === 'COMPLETED';
  return (
    <span className={`badge ${completed ? 'badge--completed' : 'badge--pending'}`}>
      {completed ? 'Completed' : 'Pending'}
    </span>
  );
}
