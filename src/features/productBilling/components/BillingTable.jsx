export function BillingTable({ items, onRemove, onQtyChange, mockup }) {
  const tableClass = mockup ? 'pb-table pb-table--mockup' : 'pb-table';
  return (
    <div className={tableClass}>
      <div className="pb-table-head">
        <div>Product</div>
        <div>Qty</div>
        <div>Price</div>
        <div>Total</div>
        <div />
      </div>
      {items.length === 0 ? (
        <div className="pb-table-empty">No items added yet.</div>
      ) : (
        items.map((it) => (
          <div key={it.productId} className="pb-table-row">
            <div className="pb-row-name">{it.name}</div>
            <div className="pb-row-qty">
              <button type="button" onClick={() => onQtyChange(it.productId, Math.max(1, it.quantity - 1))}>−</button>
              <input
                value={it.quantity}
                onChange={(e) => onQtyChange(it.productId, Math.max(1, parseInt(e.target.value || '1', 10)))}
                inputMode="numeric"
              />
              <button type="button" onClick={() => onQtyChange(it.productId, it.quantity + 1)}>+</button>
            </div>
            <div>₹{Number(it.price).toFixed(2)}</div>
            <div className="pb-row-total">₹{Number(it.price * it.quantity).toFixed(2)}</div>
            <div>
              <button type="button" className={mockup ? 'pb-mockup-remove' : 'btn btn-ghost'} onClick={() => onRemove(it.productId)} aria-label="Remove">✕</button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

