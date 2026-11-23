import Icon from './Icon.jsx';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'COMPLETED', label: 'Completed' },
];

// Search box + status filter buttons above the task list.
export default function Toolbar({ search, onSearchChange, status, onStatusChange }) {
  return (
    <div className="toolbar">
      <label className="search">
        <Icon name="search" className="search__icon" />
        <span className="visually-hidden">Search tasks by title</span>
        <input
          type="search"
          placeholder="Search by title…"
          value={search}
          maxLength={100}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </label>

      <div className="segmented" role="group" aria-label="Filter by status">
        {STATUS_OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`segmented__btn ${status === option.value ? 'segmented__btn--active' : ''}`}
            aria-pressed={status === option.value}
            onClick={() => onStatusChange(option.value)}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
