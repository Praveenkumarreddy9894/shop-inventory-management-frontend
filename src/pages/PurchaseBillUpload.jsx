import { useState, useEffect } from 'react';
import { purchasesApi } from '../services/api';

const ACCEPT = '.pdf,.jpg,.jpeg,.png';
const MAX_MB = 5;

export default function PurchaseBillUpload() {
  const [purchases, setPurchases] = useState({ data: [], total: 0 });
  const [selectedId, setSelectedId] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    purchasesApi.list({ limit: 50 }).then((res) => setPurchases(res.data));
  }, []);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_MB * 1024 * 1024) {
      setMessage(`File must be under ${MAX_MB}MB`);
      setFile(null);
      return;
    }
    const ext = (f.name.split('.').pop() || '').toLowerCase();
    if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
      setMessage('Allowed: PDF, JPG, PNG');
      setFile(null);
      return;
    }
    setMessage(null);
    setFile(f);
  };

  const hasBill = (p) => p.billFile?.contentType || p.billFile?.originalName || p.billFileUrl;

  const handleViewBill = async (id) => {
    try {
      const res = await purchasesApi.getBill(id);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not load bill');
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedId || !file) {
      setMessage(selectedId ? 'Select a file' : 'Select a purchase');
      return;
    }
    setUploading(true);
    setMessage(null);
    try {
      await purchasesApi.uploadBill(selectedId, file);
      setMessage('Bill uploaded successfully.');
      setFile(null);
      setSelectedId('');
      e.target.reset();
      purchasesApi.list({ limit: 50 }).then((res) => setPurchases(res.data));
    } catch (err) {
      setMessage(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Upload Purchase Bill</h1>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Select a purchase entry and upload the bill (PDF, JPG or PNG, max {MAX_MB}MB).
      </p>
      <div className="grid upload-grid" style={{ gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Recent purchases</h2>
          <div style={{ maxHeight: 400, overflow: 'auto' }}>
            {purchases.data.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No purchases yet. Add one from Purchases.</p>
            ) : (
              <table>
                <thead><tr><th>Date</th><th>Product</th><th>Supplier</th><th>Bill</th><th>Select</th></tr></thead>
                <tbody>
                  {purchases.data.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>{p.productId?.name || '-'}</td>
                      <td>{p.supplierName}</td>
                      <td>
                        {hasBill(p) ? (
                          <button type="button" className="btn btn-ghost" onClick={() => handleViewBill(p._id)}>View</button>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn btn-primary"
                          onClick={() => setSelectedId(p._id)}
                          disabled={uploading}
                        >
                          {selectedId === p._id ? 'Selected' : 'Select'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Upload bill file</h2>
          <form onSubmit={handleUpload}>
            <div className="form-group">
              <label>Purchase</label>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                required
              >
                <option value="">Select purchase</option>
                {purchases.data.map((p) => (
                  <option key={p._id} value={p._id}>
                    {new Date(p.createdAt).toLocaleDateString()} – {p.productId?.name || p._id} ({p.supplierName})
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>File (PDF, JPG, PNG – max {MAX_MB}MB)</label>
              <input type="file" accept={ACCEPT} onChange={handleFileChange} />
              {file && <p style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>{file.name}</p>}
            </div>
            {message && <p style={{ color: message.includes('success') ? 'var(--success)' : 'var(--danger)', marginBottom: '1rem' }}>{message}</p>}
            <button type="submit" className="btn btn-primary" disabled={!selectedId || !file || uploading} style={{ width: '100%' }}>
              {uploading ? 'Uploading...' : 'Upload Bill'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
