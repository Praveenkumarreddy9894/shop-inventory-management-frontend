import { useEffect, useMemo, useRef, useState } from 'react';
import { billingApi, productsApi } from '../services/api';
import { useI18n } from '../context/I18nContext';
import { VoiceMicHero } from '../features/productBilling/components/VoiceMicHero';
import { BillingTable } from '../features/productBilling/components/BillingTable';
import { ProductSuggestions } from '../features/productBilling/components/ProductSuggestions';
import { useDebouncedValue } from '../features/productBilling/hooks/useDebouncedValue';
import { useSpeechRecognition } from '../features/productBilling/hooks/useSpeechRecognition';
import { extractQuantityFromText, fuzzyFindProducts } from '../features/productBilling/utils/fuzzySearch';

export default function ProductBillingPage() {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(-1);
  const [billingItems, setBillingItems] = useState([]);
  const [toast, setToast] = useState('');
  const [recentBills, setRecentBills] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [printBill, setPrintBill] = useState(null);
  const printRef = useRef(null);

  const { language, t } = useI18n();

  const {
    supported,
    listening,
    transcript,
    error,
    start,
    stop,
    reset,
  } = useSpeechRecognition(language);

  const fetchRecentBills = () => {
    setRecentLoading(true);
    billingApi
      .report({ page: 1, limit: 5 })
      .then((res) => setRecentBills(res.data.data || []))
      .finally(() => setRecentLoading(false));
  };

  useEffect(() => {
    setLoadingProducts(true);
    productsApi
      .list({ limit: 1000 })
      .then((res) => setProducts(res.data.data || []))
      .finally(() => setLoadingProducts(false));
    fetchRecentBills();
  }, []);

  useEffect(() => {
    if (!printBill) return;
    const onAfterPrint = () => setPrintBill(null);
    window.addEventListener('afterprint', onAfterPrint);
    return () => window.removeEventListener('afterprint', onAfterPrint);
  }, [printBill]);

  useEffect(() => {
    if (!listening) return;
    if (transcript !== undefined) setQuery(transcript);
  }, [transcript, listening]);

  const handleVoiceToggle = () => {
    if (listening) {
      stop();
      return;
    }
    reset();
    setQuery('');
    setActiveIndex(-1);
    start();
  };

  const debouncedQuery = useDebouncedValue(query, 200);

  const { quantity: spokenQty, cleanedText } = useMemo(
    () => extractQuantityFromText(debouncedQuery),
    [debouncedQuery]
  );

  const suggestions = useMemo(
    () => fuzzyFindProducts(products, cleanedText, 8),
    [products, cleanedText]
  );

  useEffect(() => {
    setActiveIndex(suggestions.length > 0 ? 0 : -1);
  }, [cleanedText, suggestions.length]);

  const totalQty = billingItems.reduce((s, it) => s + it.quantity, 0);
  const totalAmount = billingItems.reduce((s, it) => s + it.quantity * it.price, 0);

  const addToBill = (product, quantity = 1) => {
    setBillingItems((prev) => {
      const existing = prev.find((x) => x.productId === product._id);
      if (existing) {
        return prev.map((x) =>
          x.productId === product._id ? { ...x, quantity: x.quantity + quantity } : x
        );
      }
      return [
        ...prev,
        {
          productId: product._id,
          name: product.name,
          price: Number(product.price || 0),
          quantity,
        },
      ];
    });
  };

  const onPickSuggestion = (p) => {
    addToBill(p, spokenQty || 1);
    setQuery('');
    reset();
    if (listening) stop();
  };

  const handleQueryKeyDown = (e) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) => Math.min(suggestions.length - 1, (i < 0 ? 0 : i) + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) => Math.max(0, (i < 0 ? 0 : i) - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const p = suggestions[activeIndex >= 0 ? activeIndex : 0];
      if (p) onPickSuggestion(p);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setQuery('');
    }
  };

  const handleCreateBill = async () => {
    if (billingItems.length === 0) return;
    try {
      const res = await billingApi.create({
        customerName: 'Voice Billing',
        items: billingItems.map((it) => ({
          productId: it.productId,
          quantity: it.quantity,
        })),
      });
      setToast('Billing created');
      setTimeout(() => setToast(''), 3000);
      setBillingItems([]);
      setRecentBills((prev) => [res.data.bill, ...prev].slice(0, 5));
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to create bill');
    }
  };

  const handlePrintBill = async (id) => {
    try {
      const res = await billingApi.get(id);
      const bill = res.data.data;
      setPrintBill(bill);
      setTimeout(() => window.print(), 150);
    } catch {
      alert('Could not load bill for print');
    }
  };

  return (
    <div className="pb-page pb-page--mockup">
      {toast && (
        <div className="toast toast-success no-print">
          {toast}
        </div>
      )}

      {printBill && (
        <div
          ref={printRef}
          className="billing-print card billing-print-screen"
        >
          <h3 style={{ marginTop: 0 }}>Bill {printBill.billNumber}</h3>
          <p><strong>Customer:</strong> {printBill.customerName}</p>
          <p>
            <strong>Date &amp; time:</strong>{' '}
            {new Date(printBill.createdAt || Date.now()).toLocaleString()}
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
              {(printBill.items || []).map((item, i) => (
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
            <strong>Subtotal:</strong> ₹{Number(printBill.subtotal).toFixed(2)} |{' '}
            <strong>Tax:</strong> ₹{Number(printBill.taxAmount).toFixed(2)} |{' '}
            <strong>Total:</strong> ₹{Number(printBill.total).toFixed(2)}
          </p>
        </div>
      )}

      <header className="pb-mockup-header">
        <h1 className="pb-mockup-title">{t('productBilling_title')}</h1>
        <div className="pb-mockup-kpis">
          <span>{t('productBilling_items')}: <strong>{billingItems.length}</strong></span>
          <span>{t('productBilling_quantity')}: <strong>{totalQty}</strong></span>
          <span>{t('productBilling_total')}: <strong>₹{totalAmount.toFixed(2)}</strong></span>
        </div>
      </header>

      <main className="pb-mockup-stack">
        <VoiceMicHero
          disabled={loadingProducts}
          supported={supported}
          listening={listening}
          onToggle={handleVoiceToggle}
          speakNowLabel={t('productBilling_speakNow')}
          tapToSpeakLabel={t('productBilling_tapMic')}
          notSupportedLabel={t('productBilling_voiceNotSupported')}
          loadingLabel={t('productBilling_loadingVoice')}
          helpTitle={t('productBilling_subtitle')}
        />
        {error ? <p className="pb-mockup-voice-err">{error}</p> : null}

        <section className="pb-mockup-card pb-mockup-search">
          <label className="pb-mockup-label" htmlFor="pb-smart-search">
            {t('productBilling_smartSearch')}
          </label>
          <div className="pb-mockup-input-wrap">
            <input
              id="pb-smart-search"
              className="pb-mockup-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleQueryKeyDown}
              placeholder={t('productBilling_inputPlaceholder')}
              inputMode="search"
              autoComplete="off"
            />
          </div>
          <ProductSuggestions
            variant="stacked"
            open={Boolean(cleanedText)}
            products={suggestions}
            activeIndex={activeIndex}
            onActiveChange={setActiveIndex}
            onPick={onPickSuggestion}
          />
          <div className="pb-mockup-transcript">
            <span className="pb-mockup-transcript-label">{t('productBilling_recognizedText')}</span>
            <p className="pb-mockup-transcript-text">{transcript || '—'}</p>
          </div>
        </section>

        <section className="pb-mockup-card pb-mockup-billing">
          <div className="pb-mockup-card-head">
            <h2 className="pb-mockup-section-title">{t('productBilling_billingList')}</h2>
            <div className="pb-mockup-actions">
              <button
                type="button"
                className="pb-mockup-btn pb-mockup-btn--reset"
                onClick={() => setBillingItems([])}
                disabled={billingItems.length === 0}
              >
                {t('productBilling_reset')}
              </button>
              <button
                type="button"
                className="pb-mockup-btn pb-mockup-btn--primary"
                disabled={billingItems.length === 0}
                onClick={handleCreateBill}
              >
                {t('productBilling_createBill')}
              </button>
            </div>
          </div>
          <BillingTable
            items={billingItems}
            onRemove={(id) => setBillingItems((prev) => prev.filter((x) => x.productId !== id))}
            onQtyChange={(id, qty) => setBillingItems((prev) => prev.map((x) => (x.productId === id ? { ...x, quantity: qty } : x)))}
            mockup
          />
        </section>

        <section className="pb-mockup-card pb-mockup-recent no-print">
          <h2 className="pb-mockup-section-title">{t('productBilling_recentBills')}</h2>
          {recentLoading ? (
            <p className="pb-mockup-muted">Loading...</p>
          ) : recentBills.length === 0 ? (
            <p className="pb-mockup-muted">{t('productBilling_noRecentBills')}</p>
          ) : (
            <ul className="pb-mockup-recent-list">
              {recentBills.map((bill) => (
                <li key={bill._id} className="pb-mockup-recent-row">
                  <div className="pb-mockup-recent-left">
                    <div className="pb-mockup-recent-line1">
                      <span className="pb-mockup-recent-inv">{bill.billNumber}</span>
                      <span className="pb-mockup-recent-cust">{bill.customerName}</span>
                    </div>
                    <div className="pb-mockup-recent-line2">
                      <span>₹{Number(bill.total).toFixed(2)}</span>
                      <span>{new Date(bill.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="pb-mockup-btn pb-mockup-btn--primary pb-mockup-btn--sm"
                    onClick={() => handlePrintBill(bill._id)}
                  >
                    {t('productBilling_print')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
