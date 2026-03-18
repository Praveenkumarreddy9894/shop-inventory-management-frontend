import { useState, useEffect } from 'react';
import { salesApi } from '../services/api';
import { useI18n } from '../context/I18nContext';

export default function SalesReports() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [report, setReport] = useState({ rows: [], summary: {} });
  const [list, setList] = useState({ data: [], total: 0, page: 1, totalPages: 0 });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('list');
  const { t } = useI18n();

  const fetchReport = () => {
    setLoading(true);
    salesApi.report({ from: from || undefined, to: to || undefined })
      .then((res) => setReport({ rows: res.data.rows || [], summary: res.data.summary || {} }))
      .finally(() => setLoading(false));
  };

  const fetchList = (page = 1) => {
    setLoading(true);
    salesApi.list({ page, limit: 10, from: from || undefined, to: to || undefined })
      .then((res) => setList(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (activeTab === 'list') fetchList(list.page);
    else fetchReport();
  }, [activeTab]);

  const handleExport = () => {
    salesApi.exportCSV({ from: from || undefined, to: to || undefined })
      .then((res) => {
        const url = URL.createObjectURL(new Blob([res.data]));
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sales-report.csv';
        a.click();
        URL.revokeObjectURL(url);
      })
      .catch(() => alert('Export failed'));
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>{t('sales_title')}</h1>
      <div className="card">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          <button type="button" className="btn btn-primary" onClick={() => { setActiveTab('list'); fetchList(1); }}>List</button>
          <button type="button" className="btn btn-primary" onClick={() => { setActiveTab('report'); fetchReport(); }}>Report</button>
          <button type="button" className="btn btn-ghost" onClick={handleExport}>Export CSV</button>
        </div>
        {activeTab === 'list' && (
          <>
            <table>
              <thead><tr><th>Date</th><th>Bill #</th><th>Amount</th></tr></thead>
              <tbody>
                {list.data.map((s) => (
                  <tr key={s._id}>
                    <td>{new Date(s.date).toLocaleDateString()}</td>
                    <td>{s.billNumber}</td>
                    <td>₹{Number(s.amount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
              <span>Total: {list.total}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" disabled={list.page <= 1} onClick={() => { setList((l) => ({ ...l, page: l.page - 1 })); fetchList(list.page - 1); }}>Prev</button>
                <span>Page {list.page} of {list.totalPages || 1}</span>
                <button type="button" className="btn btn-ghost" disabled={list.page >= (list.totalPages || 1)} onClick={() => { setList((l) => ({ ...l, page: l.page + 1 })); fetchList(list.page + 1); }}>Next</button>
              </div>
            </div>
          </>
        )}
        {activeTab === 'report' && (
          <>
            {loading ? <p>Loading...</p> : (
              <>
                <p><strong>Total Revenue:</strong> ₹{Number(report.summary.totalRevenue || 0).toFixed(2)} | <strong>Count:</strong> {report.summary.count || 0}</p>
                <table>
                  <thead><tr><th>Date</th><th>Bill #</th><th>Amount</th></tr></thead>
                  <tbody>
                    {report.rows.map((s) => (
                      <tr key={s._id}>
                        <td>{new Date(s.date).toLocaleDateString()}</td>
                        <td>{s.billNumber}</td>
                        <td>₹{Number(s.amount).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
