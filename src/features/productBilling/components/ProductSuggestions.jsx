import { useEffect, useRef } from 'react';

export function ProductSuggestions({
  open,
  products,
  activeIndex,
  onPick,
  onActiveChange,
  variant = 'dropdown',
}) {
  const listRef = useRef(null);

  useEffect(() => {
    if (!listRef.current) return;
    if (activeIndex < 0) return;
    const el = listRef.current.querySelector(`[data-idx="${activeIndex}"]`);
    if (!el) return;
    el.scrollIntoView({ block: 'nearest' });
  }, [activeIndex]);

  if (!open) return null;

  const rootClass =
    variant === 'stacked' ? 'pb-suggestions pb-suggestions--stacked' : 'pb-suggestions';

  return (
    <div className={rootClass} ref={listRef} role="listbox">
      {products.length === 0 ? (
        <div className="pb-suggestions-empty">No matches.</div>
      ) : (
        products.map((p, idx) => (
          <button
            key={p._id}
            type="button"
            className={`pb-suggestion ${variant === 'stacked' ? 'pb-suggestion--card' : ''} ${idx === activeIndex ? 'is-active' : ''}`}
            data-idx={idx}
            role="option"
            aria-selected={idx === activeIndex}
            onMouseEnter={() => onActiveChange?.(idx)}
            onClick={() => onPick?.(p)}
          >
            <div className="pb-suggestion-name">{p.name}</div>
            <div className="pb-suggestion-meta">
              {p.sku ? <span className="pb-pill">{p.sku}</span> : null}
              <span className="pb-price">₹{Number(p.price || 0).toFixed(2)}</span>
              <span className="pb-muted">Stock: {p.quantity}</span>
            </div>
          </button>
        ))
      )}
    </div>
  );
}

