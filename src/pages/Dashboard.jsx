import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { dashboardApi, salesApi } from '../services/api';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalProducts: 0, dailySales: 0, lowStockCount: 0, lowStockItems: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    salesApi.list({ limit: 5 }).then((res) => setRecentSales(res.data.data || [])).catch(() => {});
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!stats) return <div>Failed to load dashboard.</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Dashboard</h1>
      <div className="grid grid-4" style={{ marginBottom: '2rem' }}>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Total Products</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>{stats.totalProducts}</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Daily Sales</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700 }}>₹{Number(stats.dailySales).toFixed(2)}</div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{stats.dailySalesCount} transactions</div>
        </div>
        <div className="card">
          <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Low Stock Items</div>
          <div style={{ fontSize: '1.75rem', fontWeight: 700, color: stats.lowStockCount > 0 ? 'var(--warning)' : 'inherit' }}>{stats.lowStockCount}</div>
        </div>
        <div className="card">
          <Link to="/products" className="btn btn-primary">Manage Products</Link>
        </div>
      </div>
      {recentSales.length > 0 && (
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Recent transactions</h2>
          <table>
            <thead><tr><th>Date</th><th>Bill #</th><th>Amount</th></tr></thead>
            <tbody>
              {recentSales.map((s) => (
                <tr key={s._id}>
                  <td>{new Date(s.date).toLocaleString()}</td>
                  <td>{s.billNumber}</td>
                  <td>₹{Number(s.amount).toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Link to="/sales" className="btn btn-ghost">View all sales</Link>
        </div>
      )}
      {stats.lowStockItems && stats.lowStockItems.length > 0 && (
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Low Stock Alert</h2>
          <table>
            <thead>
              <tr><th>Product</th><th>SKU</th><th>Quantity</th><th>Threshold</th></tr>
            </thead>
            <tbody>
              {stats.lowStockItems.map((p) => (
                <tr key={p._id}>
                  <td>{p.name}</td>
                  <td>{p.sku}</td>
                  <td><span className={p.quantity === 0 ? 'badge badge-danger' : 'badge badge-warning'}>{p.quantity}</span></td>
                  <td>{p.lowStockThreshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem' }}><Link to="/products?lowStock=true" className="btn btn-ghost">View all</Link></div>
        </div>
      )}
    </div>
  );
}
