import { useState, useEffect } from 'react';
import { productsApi, purchasesApi } from '../services/api';

const hasBill = (p) => p.billFile?.contentType || p.billFile?.originalName || p.billFileUrl;

export default function PurchaseEntry() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState({ data: [], total: 0, page: 1, totalPages: 0 });
  const [form, setForm] = useState({ productId: '', supplierName: '', quantity: '', unitCost: '' });
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleViewBill = async (id) => {
    try {
      const res = await purchasesApi.getBill(id);
      const url = URL.createObjectURL(res.data);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (err) {
      alert(err.response?.data?.message || 'Could not load bill');
    }
  };

  useEffect(() => {
    productsApi.list({ limit: 500 }).then((res) => setProducts(res.data.data || []));
  }, []);

  useEffect(() => {
    setLoading(true);
    purchasesApi.list({ page: purchases.page, limit: 10 })
      .then((res) => setPurchases(res.data))
      .finally(() => setLoading(false));
  }, [purchases.page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.productId || !form.supplierName || !form.quantity || !form.unitCost) {
      alert('Fill all fields');
      return;
    }
    setSubmitting(true);
    try {
      await purchasesApi.create({
        productId: form.productId,
        supplierName: form.supplierName,
        quantity: parseInt(form.quantity, 10),
        unitCost: parseFloat(form.unitCost),
      });
      setForm({ productId: '', supplierName: '', quantity: '', unitCost: '' });
      setPurchases((p) => ({ ...p, page: 1 }));
      purchasesApi.list({ page: 1, limit: 10 }).then((res) => setPurchases(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to record purchase');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Purchase Entry</h1>
      <div className="grid" style={{ gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Record Purchase</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Product</label>
              <select
                value={form.productId}
                onChange={(e) => setForm((f) => ({ ...f, productId: e.target.value }))}
                required
              >
                <option value="">Select product</option>
                {products.map((p) => (
                  <option key={p._id} value={p._id}>{p.name} ({p.sku})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Supplier Name</label>
              <input
                value={form.supplierName}
                onChange={(e) => setForm((f) => ({ ...f, supplierName: e.target.value }))}
                placeholder="Supplier name"
                required
              />
            </div>
            <div className="form-group">
              <label>Quantity</label>
              <input
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Unit Cost (₹)</label>
              <input
                type="number"
                step={0.01}
                min={0}
                value={form.unitCost}
                onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%' }}>
              {submitting ? 'Saving...' : 'Record Purchase'}
            </button>
          </form>
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Purchase History</h2>
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Product</th>
                    <th>Supplier</th>
                    <th>Qty</th>
                    <th>Unit Cost</th>
                    <th>Total</th>
                    <th>Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.data.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>{p.productId?.name || p.productId}</td>
                      <td>{p.supplierName}</td>
                      <td>{p.quantity}</td>
                      <td>₹{Number(p.unitCost).toFixed(2)}</td>
                      <td>₹{Number(p.totalCost).toFixed(2)}</td>
                      <td>
                        {hasBill(p) ? (
                          <button type="button" className="btn btn-ghost" onClick={() => handleViewBill(p._id)}>View</button>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '1rem' }}>
                <span>Total: {purchases.total}</span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button type="button" className="btn btn-ghost" disabled={purchases.page <= 1} onClick={() => setPurchases((p) => ({ ...p, page: p.page - 1 }))}>Prev</button>
                  <span>Page {purchases.page} of {purchases.totalPages || 1}</span>
                  <button type="button" className="btn btn-ghost" disabled={purchases.page >= (purchases.totalPages || 1)} onClick={() => setPurchases((p) => ({ ...p, page: p.page + 1 }))}>Next</button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
