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
  const printRef = useRef(null);

  useEffect(() => {
    productsApi.list({ limit: 200 }).then((res) => setProducts(res.data.data || []));
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
      setCustomerName('');
      setCart([]);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create bill');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div>
      <h1 style={{ marginTop: 0 }}>Billing</h1>
      <div className="grid billing-grid">
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Products</h2>
          <div className="form-group no-print">
            <input
              type="search"
              placeholder="Search product name or SKU..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              style={{ maxWidth: 320 }}
            />
          </div>
          {loading ? <p>Loading...</p> : (
            <table>
              <thead><tr><th>Name</th><th>Price</th><th>Stock</th><th>Add</th></tr></thead>
              <tbody>
                {filteredProducts.map((p) => (
                  <tr key={p._id}>
                    <td>{p.name}</td>
                    <td>₹{Number(p.price).toFixed(2)}</td>
                    <td>{p.quantity}</td>
                    <td><button type="button" className="btn btn-primary" onClick={() => addToCart(p)}>Add</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="card">
          <h2 style={{ marginTop: 0, fontSize: '1.1rem' }}>Current Bill</h2>
          <form onSubmit={handleCreateBill}>
            <div className="form-group">
              <label>Customer Name</label>
              <input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Customer name" required />
            </div>
            {cart.length > 0 ? (
              <>
                <table>
                  <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th></th></tr></thead>
                  <tbody>
                    {cart.map((c) => (
                      <tr key={c.productId}>
                        <td>{c.name}</td>
                        <td>
                          <button type="button" onClick={() => updateQty(c.productId, -1)}>−</button>
                          <span style={{ margin: '0 0.5rem' }}>{c.quantity}</span>
                          <button type="button" onClick={() => updateQty(c.productId, 1)}>+</button>
                        </td>
                        <td>₹{(c.price * c.quantity).toFixed(2)}</td>
                        <td><button type="button" className="btn btn-ghost" onClick={() => removeFromCart(c.productId)}>Remove</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
                <p>Tax (18%): ₹{taxAmount.toFixed(2)}</p>
                <p style={{ fontWeight: 700 }}>Total: ₹{total.toFixed(2)}</p>
                <button type="submit" className="btn btn-primary" disabled={submitting} style={{ width: '100%', marginTop: '1rem' }}>{submitting ? 'Creating...' : 'Create Bill'}</button>
              </>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>Add products from the list.</p>
            )}
          </form>
          {lastBill && (
            <div ref={printRef} className="card" style={{ marginTop: '1rem', padding: '1rem', background: 'var(--bg)', borderRadius: 8 }}>
              <h3 style={{ marginTop: 0 }}>Bill {lastBill.billNumber}</h3>
              <p><strong>Customer:</strong> {lastBill.customerName}</p>
              <table>
                <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
                <tbody>
                  {(lastBill.items || []).map((item, i) => (
                    <tr key={i}><td>{item.name}</td><td>{item.quantity}</td><td>₹{Number(item.price).toFixed(2)}</td><td>₹{Number(item.total).toFixed(2)}</td></tr>
                  ))}
                </tbody>
              </table>
              <p><strong>Subtotal:</strong> ₹{Number(lastBill.subtotal).toFixed(2)} | <strong>Tax:</strong> ₹{Number(lastBill.taxAmount).toFixed(2)} | <strong>Total:</strong> ₹{Number(lastBill.total).toFixed(2)}</p>
              <div className="no-print" style={{ marginTop: '0.75rem' }}>
                <button type="button" className="btn btn-primary" onClick={handlePrint}>Print / Download PDF</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
