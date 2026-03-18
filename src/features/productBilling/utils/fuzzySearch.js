function normalize(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function scoreProduct(product, tokens) {
  const hay = normalize(`${product?.name || ''} ${product?.sku || ''} ${product?.category || ''}`);
  if (!hay) return 0;
  let score = 0;
  for (const t of tokens) {
    if (!t) continue;
    if (hay.includes(t)) score += 3;
    // prefix boost
    if (hay.split(' ').some((w) => w.startsWith(t))) score += 2;
  }
  return score;
}

export function extractQuantityFromText(text) {
  const m = String(text || '').match(/(?:qty|quantity|x)?\s*(\d{1,3})\b/i);
  if (!m) return { quantity: null, cleanedText: text };
  const quantity = Math.max(1, Number(m[1]));
  const cleanedText = String(text || '').replace(m[0], ' ').replace(/\s+/g, ' ').trim();
  return { quantity, cleanedText };
}

export function fuzzyFindProducts(products, query, limit = 8) {
  const q = normalize(query);
  if (!q) return [];
  const tokens = q.split(' ').filter(Boolean);
  return (products || [])
    .map((p) => ({ p, s: scoreProduct(p, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p);
}

