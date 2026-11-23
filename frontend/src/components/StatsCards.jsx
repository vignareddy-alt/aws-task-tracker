import Icon from './Icon.jsx';

// The three summary cards at the top of the dashboard.
export default function StatsCards({ stats, loading }) {
  const cards = [
    { label: 'Total tasks', value: stats.total, icon: 'list', tone: 'total' },
    { label: 'Completed', value: stats.completed, icon: 'checkCircle', tone: 'completed' },
    { label: 'Pending', value: stats.pending, icon: 'clock', tone: 'pending' },
  ];

  return (
    <section className="stats" aria-label="Task summary">
      {cards.map((card) => (
        <div key={card.label} className={`stat-card stat-card--${card.tone}`}>
          <span className="stat-card__icon">
            <Icon name={card.icon} size={20} />
          </span>
          <div>
            <p className="stat-card__label">{card.label}</p>
            <p className="stat-card__value">{loading && stats.total === 0 ? '…' : card.value}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
