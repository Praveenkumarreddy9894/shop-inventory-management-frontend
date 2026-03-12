import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { to: '/', label: 'Dashboard' },
  { to: '/products', label: 'Products' },
  { to: '/billing', label: 'Billing' },
  { to: '/sales', label: 'Sales' },
  { to: '/purchases', label: 'Purchases' },
  { to: '/purchases/upload', label: 'Upload Bill' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-layout">
      <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen((o) => !o)} aria-label="Toggle menu">
        <span className="hamburger" />
        <span className="hamburger" />
        <span className="hamburger" />
      </button>
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <Link to="/" onClick={() => setSidebarOpen(false)}>Shop Inventory</Link>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {label}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.name || user?.email}</span>
          <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>Logout</button>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
