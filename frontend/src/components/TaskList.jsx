import { Link } from 'react-router-dom';
import Icon from './Icon.jsx';
import { PriorityBadge, StatusBadge } from './Badges.jsx';
import { formatDate, isOverdue } from '../utils/format.js';

// Shows tasks as a table on wide screens; CSS turns each row into a card
// on phones (see .task-table rules in index.css).
export default function TaskList({ tasks, busyIds, onToggleStatus, onDelete }) {
  return (
    <div className="table-wrap">
      <table className="task-table">
        <thead>
          <tr>
            <th scope="col" className="task-table__check">
              <span className="visually-hidden">Done</span>
            </th>
            <th scope="col">Task</th>
            <th scope="col">Priority</th>
            <th scope="col">Due date</th>
            <th scope="col">Status</th>
            <th scope="col" className="task-table__actions-head">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((task) => {
            const completed = task.status === 'COMPLETED';
            const overdue = isOverdue(task);
            const busy = busyIds.has(task.id);

            return (
              <tr key={task.id} className={completed ? 'is-completed' : ''}>
                <td className="task-table__check">
                  <button
                    type="button"
                    className={`check-btn ${completed ? 'check-btn--on' : ''}`}
                    onClick={() => onToggleStatus(task)}
                    disabled={busy}
                    aria-label={completed ? `Mark "${task.title}" as pending` : `Mark "${task.title}" as completed`}
                    title={completed ? 'Mark as pending' : 'Mark as completed'}
                  >
                    {busy ? <span className="spinner spinner--sm" /> : <Icon name="check" size={14} />}
                  </button>
                </td>
                <td className="task-table__title">
                  <Link to={`/tasks/${task.id}`}>{task.title}</Link>
                  {task.description && <p className="task-table__desc">{task.description}</p>}
                </td>
                <td data-label="Priority">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td data-label="Due" className={overdue ? 'text-danger' : ''}>
                  {formatDate(task.due_date)}
                  {overdue && <span className="overdue-tag">Overdue</span>}
                </td>
                <td data-label="Status">
                  <StatusBadge status={task.status} />
                </td>
                <td className="task-table__actions">
                  <Link to={`/tasks/${task.id}`} className="icon-btn" title="View details" aria-label={`View "${task.title}"`}>
                    <Icon name="eye" />
                  </Link>
                  <Link to={`/tasks/${task.id}/edit`} className="icon-btn" title="Edit" aria-label={`Edit "${task.title}"`}>
                    <Icon name="edit" />
                  </Link>
                  <button
                    type="button"
                    className="icon-btn icon-btn--danger"
                    onClick={() => onDelete(task)}
                    disabled={busy}
                    title="Delete"
                    aria-label={`Delete "${task.title}"`}
                  >
                    <Icon name="trash" />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
