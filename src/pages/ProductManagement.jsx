import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../services/api';
import { PRODUCT_CATEGORIES } from '../utils/constants';

export default function ProductManagement() {
  const [searchParams] = useSearchParams();
  const [data, setData] = useState({ data: [], total: 0, page: 1, totalPages: 0 });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [lowStock, setLowStock] = useState(searchParams.get('lowStock') === 'true');
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState({ name: '', sku: '', category: '', price: '', costPrice: '', quantity: '0', lowStockThreshold: '5', unit: 'pcs' });

  const fetchProducts = () => {
    setLoading(true);
    productsApi
      .list({ page, limit: 10, search: search || undefined, category: category || undefined, lowStock: lowStock || undefined })
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [page, search, category, lowStock]);

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchProducts();
  };

  const openAdd = () => {
    setForm({ name: '', sku: '', category: 'General', price: '', costPrice: '', quantity: '0', lowStockThreshold: '5', unit: 'pcs' });
    setModal('add');
  };

  const openEdit = (p) => {
    setForm({
      name: p.name,
      sku: p.sku,
      category: PRODUCT_CATEGORIES.includes(p.category) ? p.category : 'General',
      price: String(p.price),
      costPrice: String(p.costPrice ?? ''),
      quantity: String(p.quantity),
      lowStockThreshold: String(p.lowStockThreshold ?? 5),
      unit: p.unit || 'pcs',
    });
    setModal({ type: 'edit', id: p._id });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      sku: form.sku,
      category: form.category,
      price: parseFloat(form.price),
      costPrice: form.costPrice ? parseFloat(form.costPrice) : 0,
      quantity: parseInt(form.quantity, 10) || 0,
      lowStockThreshold: parseInt(form.lowStockThreshold, 10) || 5,
      unit: form.unit,
    };
    try {
      if (modal === 'add') {
        await productsApi.create(payload);
      } else {
        await productsApi.update(modal.id, payload);
      }
      setModal(null);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await productsApi.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <h1 style={{ margin: 0 }}>Product Management</h1>
        <button type="button" className="btn btn-primary" onClick={openAdd}>Add Product</button>
      </div>

      <div className="card" style={{ marginTop: '1.5rem' }}>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
          <input
            type="text"
            placeholder="Search by name"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: 200 }}
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            style={{ width: 160 }}
          >
            <option value="">All categories</option>
            {PRODUCT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input type="checkbox" checked={lowStock} onChange={(e) => setLowStock(e.target.checked)} />
            Low stock only
          </label>
          <button type="submit" className="btn btn-primary">Search</button>
        </form>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>{p.sku}</td>
                    <td>{p.category}</td>
                    <td>₹{Number(p.price).toFixed(2)}</td>
                    <td>
                      <span className={p.quantity <= (p.lowStockThreshold || 0) ? 'badge badge-warning' : 'badge badge-success'}>
                        {p.quantity} {p.unit}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="btn btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                      <button type="button" className="btn btn-danger" style={{ marginLeft: '0.5rem' }} onClick={() => handleDelete(p._id)}>Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Total: {data.total}</span>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button type="button" className="btn btn-ghost" disabled={data.page <= 1} onClick={() => setPage((p) => p - 1)}>Prev</button>
                <span style={{ alignSelf: 'center' }}>Page {data.page} of {data.totalPages || 1}</span>
                <button type="button" className="btn btn-ghost" disabled={data.page >= (data.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
              </div>
            </div>
          </>
        )}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }} onClick={() => setModal(null)}>
          <div className="card" style={{ maxWidth: 440, width: '100%' }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ marginTop: 0 }}>{modal === 'add' ? 'Add Product' : 'Edit Product'}</h2>
            <form onSubmit={handleSubmit}>
              {['name', 'sku', 'category', 'price', 'costPrice', 'quantity', 'lowStockThreshold', 'unit'].map((key) => (
                <div key={key} className="form-group">
                  <label>{key.replace(/([A-Z])/g, ' $1').trim()}</label>
                  {key === 'category' ? (
                    <select
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                    >
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  ) : (
                    <input
                      value={form[key]}
                      onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                      type={key.includes('Price') || key === 'quantity' || key === 'lowStockThreshold' ? 'number' : 'text'}
                      step={key.includes('Price') ? 0.01 : undefined}
                      min={key === 'quantity' || key === 'lowStockThreshold' ? 0 : undefined}
                    />
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                <button type="submit" className="btn btn-primary">Save</button>
                <button type="button" className="btn btn-ghost" onClick={() => setModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
