import { Link, useLocation } from 'react-router-dom';
import Icon from './Icon.jsx';

const NAV_ITEMS = [
  { label: 'Dashboard', to: '/', icon: 'dashboard', match: (path, status) => path === '/' && !status },
  { label: 'Pending', to: '/?status=PENDING', icon: 'clock', match: (path, status) => path === '/' && status === 'PENDING' },
  { label: 'Completed', to: '/?status=COMPLETED', icon: 'checkCircle', match: (path, status) => path === '/' && status === 'COMPLETED' },
  { label: 'Add Task', to: '/tasks/new', icon: 'plus', match: (path) => path === '/tasks/new' },
];

export default function Sidebar({ open, onClose }) {
  const { pathname, search } = useLocation();
  const status = new URLSearchParams(search).get('status');

  return (
    <>
      <aside className={`sidebar ${open ? 'sidebar--open' : ''}`} aria-label="Main navigation">
        <div className="sidebar__brand">
          <span className="sidebar__logo">
            <Icon name="check" size={18} />
          </span>
          <span>Task Tracker</span>
          <button type="button" className="sidebar__close" onClick={onClose} aria-label="Close menu">
            <Icon name="x" />
          </button>
        </div>

        <nav className="sidebar__nav">
          {NAV_ITEMS.map((item) => {
            const active = item.match(pathname, status);
            return (
              <Link
                key={item.label}
                to={item.to}
                className={`sidebar__link ${active ? 'sidebar__link--active' : ''}`}
                aria-current={active ? 'page' : undefined}
                onClick={onClose}
              >
                <Icon name={item.icon} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <p className="sidebar__footer">React · Express · MySQL</p>
      </aside>
      {open && <div className="sidebar__backdrop" onClick={onClose} aria-hidden="true" />}
    </>
  );
}
