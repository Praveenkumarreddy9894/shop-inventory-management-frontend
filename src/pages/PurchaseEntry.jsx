import { useState, useEffect, useRef } from 'react';
import { productsApi, purchasesApi } from '../services/api';
import { useI18n } from '../context/I18nContext';

const hasBill = (p) => p.billFile?.contentType || p.billFile?.originalName || p.billFileUrl;

export default function PurchaseEntry() {
  const [products, setProducts] = useState([]);
  const [purchases, setPurchases] = useState({ data: [], total: 0, page: 1, totalPages: 0 });
  const [supplierName, setSupplierName] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [activeProductIndex, setActiveProductIndex] = useState(-1);
  const [lineForm, setLineForm] = useState({ productId: '', quantity: '', unitCost: '' });
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const smartSearchListRef = useRef(null);
  const { t } = useI18n();

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

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())))
    : products;

  const visibleProducts = productSearch.trim() ? filteredProducts.slice(0, 8) : [];

  useEffect(() => {
    setActiveProductIndex(visibleProducts.length > 0 ? 0 : -1);
  }, [productSearch, visibleProducts.length]);

  const addVisibleProductAtIndex = (index) => {
    const p = visibleProducts[index];
    if (!p) return;
    setLineForm((f) => ({ ...f, productId: p._id }));
    setProductSearch(`${p.name}${p.sku ? ` (${p.sku})` : ''}`);
    setActiveProductIndex(index);
  };

  const handleSmartSearchKeyDown = (e) => {
    if (!productSearch.trim()) return;
    if (visibleProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveProductIndex((i) => Math.min(visibleProducts.length - 1, (i < 0 ? 0 : i) + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveProductIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      addVisibleProductAtIndex(activeProductIndex >= 0 ? activeProductIndex : 0);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setProductSearch('');
      setActiveProductIndex(-1);
      setLineForm((f) => ({ ...f, productId: '' }));
    }
  };

  useEffect(() => {
    if (!smartSearchListRef.current) return;
    if (activeProductIndex < 0) return;
    const el = smartSearchListRef.current.querySelector(`[data-idx="${activeProductIndex}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
  }, [activeProductIndex]);

  const selectedProduct = products.find((p) => p._id === lineForm.productId);
  const lineTotal =
    (Number(lineForm.quantity || 0) * Number(lineForm.unitCost || 0)).toFixed(2);
  const purchaseTotal = items.reduce((s, it) => s + Number(it.totalCost || 0), 0);

  const handleAddLineItem = () => {
    if (!lineForm.productId || !lineForm.quantity || !lineForm.unitCost) {
      alert('Select product and enter quantity & unit cost');
      return;
    }
    const qty = Math.max(1, parseInt(lineForm.quantity, 10));
    const cost = Math.max(0, parseFloat(lineForm.unitCost));
    const totalCost = Math.round(qty * cost * 100) / 100;
    const prod = products.find((p) => p._id === lineForm.productId);
    setItems((prev) => [
      ...prev,
      {
        productId: lineForm.productId,
        name: prod?.name || 'Product',
        sku: prod?.sku,
        quantity: qty,
        unitCost: cost,
        totalCost,
      },
    ]);
    setLineForm({ productId: '', quantity: '', unitCost: '' });
    setProductSearch('');
    setActiveProductIndex(-1);
  };

  const removeItemAt = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!supplierName.trim() || items.length === 0) {
      alert(items.length === 0 ? 'Add at least one product' : 'Enter supplier name');
      return;
    }
    setSubmitting(true);
    try {
      await purchasesApi.create({
        supplierName: supplierName.trim(),
        items: items.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
          unitCost: it.unitCost,
        })),
      });
      setSupplierName('');
      setItems([]);
      setLineForm({ productId: '', quantity: '', unitCost: '' });
      setProductSearch('');
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
      <h1 style={{ marginTop: 0 }}>{t('purchases_title')}</h1>
      <div className="grid" style={{ gridTemplateColumns: '400px 1fr', gap: '1.5rem' }}>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Record Purchase</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Supplier Name</label>
              <input
                value={supplierName}
                onChange={(e) => setSupplierName(e.target.value)}
                placeholder="Supplier name"
                required
              />
            </div>

            <div className="form-group">
              <label>Add Products</label>
              <div className="billing-smart-search no-print">
                <div className="billing-smart-search-input">
                  <input
                    type="search"
                    placeholder="Search product name or SKU"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    onKeyDown={handleSmartSearchKeyDown}
                  />
                </div>
                {productSearch.trim() && (
                  <div className="billing-smart-search-results" ref={smartSearchListRef}>
                    {filteredProducts.length === 0 && (
                      <p className="billing-smart-search-empty">No products found.</p>
                    )}
                    {visibleProducts.map((p, idx) => (
                      <button
                        key={p._id}
                        type="button"
                        className={`billing-smart-search-item ${idx === activeProductIndex ? 'is-active' : ''}`}
                        data-idx={idx}
                        onClick={() => addVisibleProductAtIndex(idx)}
                      >
                        <span className="billing-smart-search-name">{p.name}</span>
                        <span className="billing-smart-search-meta">
                          {p.sku && <span className="billing-smart-search-sku">{p.sku}</span>}
                          <span className="billing-smart-search-stock">
                            Stock: {p.quantity}
                          </span>
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={lineForm.quantity}
                  onChange={(e) => setLineForm((f) => ({ ...f, quantity: e.target.value }))}
                />
              </div>
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label>Unit Cost (₹)</label>
                <input
                  type="number"
                  step={0.01}
                  min={0}
                  value={lineForm.unitCost}
                  onChange={(e) => setLineForm((f) => ({ ...f, unitCost: e.target.value }))}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                {selectedProduct ? `Selected: ${selectedProduct.name}` : 'Select a product'}
                {lineForm.quantity && lineForm.unitCost ? ` • Line total: ₹${lineTotal}` : ''}
              </div>
              <button type="button" className="btn btn-ghost" onClick={handleAddLineItem}>
                + Add Item
              </button>
            </div>

            {items.length > 0 && (
              <div style={{ marginTop: '1rem' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Qty</th>
                      <th>Unit Cost</th>
                      <th>Total</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((it, idx) => (
                      <tr key={`${it.productId}-${idx}`}>
                        <td>{it.name}{it.sku ? ` (${it.sku})` : ''}</td>
                        <td>{it.quantity}</td>
                        <td>₹{Number(it.unitCost).toFixed(2)}</td>
                        <td>₹{Number(it.totalCost).toFixed(2)}</td>
                        <td>
                          <button type="button" className="btn btn-ghost" onClick={() => removeItemAt(idx)}>✕</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div style={{ marginTop: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong>Total: ₹{purchaseTotal.toFixed(2)}</strong>
                  <button type="button" className="btn btn-ghost" onClick={() => setItems([])}>Reset</button>
                </div>
              </div>
            )}

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
                    <th>Supplier</th>
                    <th>Items</th>
                    <th>Total</th>
                    <th>Bill</th>
                  </tr>
                </thead>
                <tbody>
                  {purchases.data.map((p) => (
                    <tr key={p._id}>
                      <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                      <td>{p.supplierName}</td>
                      <td>{Array.isArray(p.items) && p.items.length > 0 ? p.items.length : 1}</td>
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
