import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useI18n } from '../../context/I18nContext';

const navItems = [
  { to: '/', labelKey: 'nav_dashboard' },
  { to: '/products', labelKey: 'nav_products' },
  { to: '/billing', labelKey: 'nav_billing' },
  { to: '/product-billing', labelKey: 'nav_productBilling' },
  { to: '/sales', labelKey: 'nav_sales' },
  { to: '/purchases', labelKey: 'nav_purchases' },
  { to: '/purchases/upload', labelKey: 'nav_purchaseUpload' },
];

export default function Layout({ children }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { language, setLanguage, t } = useI18n();

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
          {navItems.map(({ to, labelKey }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${location.pathname === to || (to !== '/' && location.pathname.startsWith(to)) ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {t(labelKey)}
            </Link>
          ))}
        </nav>
        <div className="sidebar-footer">
          <span className="sidebar-user">{user?.name || user?.email}</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', gap: '0.25rem' }}>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, opacity: language === 'en' ? 1 : 0.6 }}
                onClick={() => setLanguage('en')}
              >
                EN
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                style={{ flex: 1, opacity: language === 'ta' ? 1 : 0.6 }}
                onClick={() => setLanguage('ta')}
              >
                தமிழ்
              </button>
            </div>
            <button type="button" className="btn btn-ghost btn-block" onClick={handleLogout}>{t('nav_logout')}</button>
          </div>
        </div>
      </aside>
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} aria-hidden="true" />}
      <main className="main-content">
        <div className="container">{children}</div>
      </main>
    </div>
  );
}
