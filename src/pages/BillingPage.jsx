import { useState, useEffect, useRef } from 'react';
import { productsApi, billingApi } from '../services/api';

export default function BillingPage() {
  const [customerName, setCustomerName] = useState('');
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState('');
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastBill, setLastBill] = useState(null);
  const [toast, setToast] = useState('');
  const [recentBills, setRecentBills] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const printRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    productsApi
      .list({ limit: 200 })
      .then((res) => setProducts(res.data.data || []))
      .finally(() => setLoading(false));

    setRecentLoading(true);
    billingApi
      .report({ page: 1, limit: 5 })
      .then((res) => setRecentBills(res.data.data || []))
      .finally(() => setRecentLoading(false));
  }, []);

  const filteredProducts = productSearch.trim()
    ? products.filter((p) => p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku && p.sku.toLowerCase().includes(productSearch.toLowerCase())))
    : products;

  const addToCart = (product) => {
    const existing = cart.find((c) => c.productId === product._id);
    if (existing) {
      setCart(cart.map((c) => (c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { productId: product._id, name: product.name, price: product.price, quantity: 1 }]);
    }
  };

  const updateQty = (productId, delta) => {
    setCart(cart.map((c) => {
      if (c.productId !== productId) return c;
      const q = Math.max(0, c.quantity + delta);
      return q === 0 ? null : { ...c, quantity: q };
    }).filter(Boolean));
  };

  const removeFromCart = (productId) => setCart(cart.filter((c) => c.productId !== productId));

  const subtotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const taxAmount = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + taxAmount) * 100) / 100;

  const handleCreateBill = async (e) => {
    e.preventDefault();
    if (!customerName.trim() || cart.length === 0) {
      alert(cart.length === 0 ? 'Add at least one product' : 'Enter customer name');
      return;
    }
    setSubmitting(true);
    try {
      const res = await billingApi.create({
        customerName: customerName.trim(),
        items: cart.map((c) => ({ productId: c.productId, quantity: c.quantity })),
      });
      setLastBill(res.data.bill);
      setRecentBills((prev) => [res.data.bill, ...prev].slice(0, 5));
      setCustomerName('');
      setCart([]);
      setToast('Billing created');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePrintExistingBill = (bill) => {
    setLastBill(bill);
    setTimeout(() => {
      window.print();
    }, 0);
  };

  return (
    <div className="billing-page">
      {toast && (
        <div className="toast toast-success no-print">
          {toast}
        </div>
      )}
      <div className="billing-header no-print">
        <div>
          <p className="billing-kicker">Billing</p>
          <h1 className="billing-title">Create Bill</h1>
          <p className="billing-subtitle">Welcome, create a new invoice for your customer.</p>
        </div> 
      </div>

      <div className="billing-content">
        <div className="card billing-invoice-card">
          <div className="billing-invoice-header">
            <div>
              <h2>Create Invoice</h2>
            </div>
          </div>

          <form onSubmit={handleCreateBill}>
            <div className="billing-two-column">
              <div className="form-group">
                <label>Invoice Name</label>
                <input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Customer name"
                  required
                />
              </div>
              <div className="form-group">
                <label>Bill To</label>
                <input placeholder="Customer email or phone (optional)" />
              </div>
            </div>

            <div className="billing-items-section">
              <div className="billing-items-header">
                <span>Items</span>
              </div>

              <div className="billing-smart-search no-print">
                <div className="billing-smart-search-input">
                  <input
                    type="search"
                    placeholder="Search product name or SKU"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                </div>
                {productSearch.trim() && (
                  <div className="billing-smart-search-results">
                    {loading && <p className="billing-smart-search-empty">Searching products…</p>}
                    {!loading && filteredProducts.length === 0 && (
                      <p className="billing-smart-search-empty">No products found.</p>
                    )}
                    {!loading &&
                      filteredProducts.slice(0, 8).map((p) => (
                        <button
                          key={p._id}
                          type="button"
                          className="billing-smart-search-item"
                          onClick={() => {
                            addToCart(p);
                            setProductSearch('');
                          }}
                        >
                          <span className="billing-smart-search-name">{p.name}</span>
                          <span className="billing-smart-search-meta">
                            {p.sku && <span className="billing-smart-search-sku">{p.sku}</span>}
                            <span className="billing-smart-search-price">
                              ₹{Number(p.price).toFixed(2)}
                            </span>
                            <span className="billing-smart-search-stock">
                              Stock: {p.quantity}
                            </span>
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
              {cart.length > 0 ? (
                <div className="billing-items-table">
                  <div className="billing-items-row billing-items-row--head">
                    <div>Description</div>
                    <div>Quantity</div>
                    <div>Price</div>
                    <div />
                  </div>
                  {cart.map((c) => (
                    <div key={c.productId} className="billing-items-row">
                      <div className="billing-item-name">{c.name}</div>
                      <div className="billing-item-qty">
                        <button type="button" onClick={() => updateQty(c.productId, -1)}>
                          −
                        </button>
                        <span>{c.quantity}</span>
                        <button type="button" onClick={() => updateQty(c.productId, 1)}>
                          +
                        </button>
                      </div>
                      <div className="billing-item-price">
                        ₹{(c.price * c.quantity).toFixed(2)}
                      </div>
                      <div className="billing-item-remove">
                        <button
                          type="button"
                          className="btn btn-ghost"
                          onClick={() => removeFromCart(c.productId)}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="billing-empty-items">
                  Use the smart product search above to add items to this invoice.
                </p>
              )}
            </div>

            {cart.length > 0 && (
              <div className="billing-footer">
                <div className="billing-summary">
                  <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                  <p>Tax (18%): ₹{taxAmount.toFixed(2)}</p>
                  <p className="billing-summary-total">Total: ₹{total.toFixed(2)}</p>
                </div>
                <div className="billing-actions">
                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => {
                      setCustomerName('');
                      setCart([]);
                    }}
                  >
                    Reset
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Creating...' : 'Add Item'}
                  </button>
                </div>
              </div>
            )}
          </form>

          {lastBill && (
            <div
              ref={printRef}
              className="billing-print card billing-print-screen"
              style={{ marginTop: '1.5rem' }}
            >
              <h3 style={{ marginTop: 0 }}>Bill {lastBill.billNumber}</h3>
              <p>
                <strong>Customer:</strong> {lastBill.customerName}
              </p>
              <p>
                <strong>Date &amp; time:</strong>{' '}
                {new Date(
                  lastBill.createdAt || lastBill.created_at || Date.now(),
                ).toLocaleString()}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Qty</th>
                    <th>Price</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(lastBill.items || []).map((item, i) => (
                    <tr key={i}>
                      <td>{item.name}</td>
                      <td>{item.quantity}</td>
                      <td>₹{Number(item.price).toFixed(2)}</td>
                      <td>₹{Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p>
                <strong>Subtotal:</strong> ₹{Number(lastBill.subtotal).toFixed(2)} |{' '}
                <strong>Tax:</strong> ₹{Number(lastBill.taxAmount).toFixed(2)} |{' '}
                <strong>Total:</strong> ₹{Number(lastBill.total).toFixed(2)}
              </p>
              <div className="no-print" style={{ marginTop: '0.75rem' }}>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={handlePrint}
                >
                  Print / Download PDF
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="card billing-recent-card no-print">
          <h2>Recent Bills</h2>
          {recentLoading ? (
            <p>Loading...</p>
          ) : recentBills.length === 0 ? (
            <p className="billing-empty-items">No recent bills found.</p>
          ) : (
            <ul className="billing-recent-list">
              {recentBills.map((bill) => (
                <li key={bill._id} className="billing-recent-item">
                  <div className="billing-recent-main">
                    <div className="billing-recent-title">
                      {bill.billNumber}{' '}
                      <span className="billing-recent-customer">{bill.customerName}</span>
                    </div>
                    <div className="billing-recent-meta">
                      <span>
                        Total: ₹{Number(bill.total).toFixed(2)}
                      </span>
                      <span>
                        {new Date(bill.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="btn btn-primary billing-recent-print-btn"
                    onClick={() => handlePrintExistingBill(bill)}
                  >
                    Print
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
