import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { clearToken } from '../auth.js';
import { CONFIG } from '../config.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '📊', end: true },
  { to: '/conversations', label: 'Conversations', icon: '💬' },
  { to: '/leads', label: 'Leads', icon: '🎯' },
  { to: '/suppliers', label: 'Suppliers', icon: '🏭' },
  { to: '/products', label: 'Products', icon: '📦' },
  { to: '/rfqs', label: 'RFQs', icon: '📝' },
  { to: '/tickets', label: 'Tickets & Handoffs', icon: '🛟' },
  { to: '/training', label: 'Training', icon: '🧠' },
  { to: '/settings', label: 'Settings', icon: '⚙️' }
];

export default function Layout() {
  const navigate = useNavigate();
  const logout = () => {
    clearToken();
    navigate('/login');
  };

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-badge">＋</span>
          <div>
            <div className="brand-name">{CONFIG.brand}</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          ⏻ Log out
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
