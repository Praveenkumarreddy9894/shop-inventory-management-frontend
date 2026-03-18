import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { dashboardApi, salesApi } from '../services/api';
import { useI18n } from '../context/I18nContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

const CHART_COLORS = {
  bar: 'rgba(88, 166, 255, 0.85)',
  barHover: 'rgba(121, 184, 255, 0.95)',
  grid: 'rgba(45, 58, 79, 0.6)',
  text: '#8b949e',
};

function ChartCard({ title, items, height = 260, horizontal = false }) {
  const { data, options } = useMemo(() => {
    const list = items || [];
    const labels = list.map((i) => i.label);
    const values = list.map((i) => Number(i.value || 0));
    const dataInner = {
      labels,
      datasets: [
        {
          label: 'Amount (₹)',
          data: values,
          backgroundColor: CHART_COLORS.bar,
          hoverBackgroundColor: CHART_COLORS.barHover,
          borderRadius: 6,
          borderSkipped: false,
        },
      ],
    };
    const optionsInner = {
      indexAxis: horizontal ? 'y' : 'x',
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => `₹${Number(ctx.raw || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
          },
        },
      },
      scales: horizontal
        ? {
            x: {
              beginAtZero: true,
              ticks: {
                color: CHART_COLORS.text,
                callback: (v) => `₹${Number(v).toLocaleString()}`,
              },
              grid: { color: CHART_COLORS.grid },
            },
            y: {
              ticks: { color: CHART_COLORS.text, maxRotation: 0, autoSkip: false },
              grid: { display: false },
            },
          }
        : {
            x: {
              ticks: { color: CHART_COLORS.text, maxRotation: 45, minRotation: 0 },
              grid: { display: false },
            },
            y: {
              beginAtZero: true,
              ticks: {
                color: CHART_COLORS.text,
                callback: (v) => `₹${Number(v).toLocaleString()}`,
              },
              grid: { color: CHART_COLORS.grid },
            },
          },
    };
    return { data: dataInner, options: optionsInner };
  }, [items, horizontal]);

  if (!items || items.length === 0) {
    return (
      <div className="card">
        <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>{title}</h2>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', minHeight: height, display: 'flex', alignItems: 'center' }}>
          No data available.
        </div>
      </div>
    );
  }
  return (
    <div className="card">
      <h2 style={{ marginTop: 0, fontSize: '1.05rem' }}>{title}</h2>
      <div style={{ height, position: 'relative' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [recentSales, setRecentSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dailySeries, setDailySeries] = useState([]);
  const [weeklySeries, setWeeklySeries] = useState([]);
  const [topProducts, setTopProducts] = useState([]);

  const { t } = useI18n();

  useEffect(() => {
    dashboardApi.getStats()
      .then((res) => setStats(res.data))
      .catch(() => setStats({ totalProducts: 0, dailySales: 0, lowStockCount: 0, lowStockItems: [] }))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    salesApi.list({ limit: 5 }).then((res) => setRecentSales(res.data.data || [])).catch(() => {});
  }, []);

  useEffect(() => {
    const buildDailyFromReportRows = (rows) => {
      const now = new Date();
      const byDay = new Map();
      (rows || []).forEach((r) => {
        const key = new Date(r.date).toISOString().slice(0, 10);
        byDay.set(key, (byDay.get(key) || 0) + Number(r.amount || 0));
      });
      const series = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - i));
        const key = d.toISOString().slice(0, 10);
        series.push({
          label: new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }),
          value: byDay.get(key) || 0,
        });
      }
      return series;
    };

    const fallbackFromReport = () => {
      const now = new Date();
      const from = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6));
      salesApi
        .report({ from: from.toISOString(), to: now.toISOString() })
        .then((res) => {
          const rows = res.data.rows || [];
          setDailySeries(buildDailyFromReportRows(rows));
          const wk = new Date(now);
          wk.setDate(wk.getDate() - wk.getDay());
          wk.setHours(0, 0, 0, 0);
          const prev = new Date(wk);
          prev.setDate(prev.getDate() - 7);
          let thisW = 0;
          let lastW = 0;
          rows.forEach((r) => {
            const d = new Date(r.date);
            const a = Number(r.amount || 0);
            if (d >= wk && d <= now) thisW += a;
            else if (d >= prev && d < wk) lastW += a;
          });
          setWeeklySeries([
            { label: 'Last Week', value: lastW },
            { label: 'This Week', value: thisW },
          ]);
        })
        .catch(() => {
          setDailySeries([]);
          setWeeklySeries([]);
        });
    };

    salesApi
      .summary()
      .then((res) => {
        const { dailyChart, daily = [], weekly = {}, topProducts: tops = [] } = res.data;
        if (dailyChart && dailyChart.length > 0) {
          setDailySeries(
            dailyChart.map((d) => ({ label: d.label, value: Number(d.value || 0) })),
          );
        } else {
          const now = new Date();
          const byDay = new Map(daily.map((d) => [d.date, Number(d.total || 0)]));
          const series = [];
          for (let i = 6; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
            series.push({
              label: d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              value: byDay.get(key) || 0,
            });
          }
          setDailySeries(series);
        }
        setWeeklySeries([
          { label: 'Last Week', value: Number(weekly.lastWeek || 0) },
          { label: 'This Week', value: Number(weekly.thisWeek || 0) },
        ]);
        setTopProducts(
          tops.map((p) => ({ label: p.name || 'Unknown', value: Number(p.total || 0) })),
        );
      })
      .catch(() => {
        fallbackFromReport();
        setTopProducts([]);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (!stats) return <div>Failed to load.</div>;

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{t('dashboard_title')}</h1>
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
      <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
        <ChartCard title="Daily Sales (last 7 days)" items={dailySeries} height={280} />
        <ChartCard title="Weekly Sales" items={weeklySeries} height={220} />
      </div>
      <div className="grid grid-2" style={{ marginBottom: '1.5rem' }}>
        <ChartCard title="High Sale Products" items={topProducts} height={Math.max(220, (topProducts.length || 1) * 48)} horizontal />
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
      </div>
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
