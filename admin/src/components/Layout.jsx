import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  MessagesSquare,
  Target,
  Factory,
  Package,
  FileText,
  LifeBuoy,
  BrainCircuit,
  Settings,
  LogOut,
  Sparkles
} from 'lucide-react';
import { clearToken } from '../auth.js';
import { CONFIG } from '../config.js';

const NAV = [
  { to: '/', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/conversations', label: 'Conversations', Icon: MessagesSquare },
  { to: '/leads', label: 'Leads', Icon: Target },
  { to: '/suppliers', label: 'Suppliers', Icon: Factory },
  { to: '/products', label: 'Products', Icon: Package },
  { to: '/rfqs', label: 'RFQs', Icon: FileText },
  { to: '/tickets', label: 'Tickets & Handoffs', Icon: LifeBuoy },
  { to: '/training', label: 'Training', Icon: BrainCircuit },
  { to: '/settings', label: 'Settings', Icon: Settings }
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
          <span className="brand-badge">
            <Sparkles size={18} strokeWidth={2.2} />
          </span>
          <div>
            <div className="brand-name">{CONFIG.brand}</div>
            <div className="brand-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map(({ to, label, Icon, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
              <span className="nav-icon">
                <Icon size={18} strokeWidth={2} />
              </span>
              {label}
            </NavLink>
          ))}
        </nav>

        <button className="logout" onClick={logout}>
          <LogOut size={16} strokeWidth={2} /> Log out
        </button>
      </aside>

      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
