import "server-only";

export type Quote = { price: number; currency: string };

// Caché en memoria del proceso, 15 min, para no machacar Yahoo en cada carga.
const CACHE = new Map<string, { quote: Quote; at: number }>();
const TTL_MS = 15 * 60 * 1000;

async function fetchOne(symbol: string): Promise<Quote | null> {
  const cached = CACHE.get(symbol);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.quote;
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const r = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      // Evita que Next cachee indefinidamente la respuesta del fetch:
      next: { revalidate: 900 },
    });
    if (!r.ok) return null;
    const j = await r.json();
    const meta = j?.chart?.result?.[0]?.meta;
    const price = meta?.regularMarketPrice;
    const currency = meta?.currency;
    if (typeof price !== "number" || !currency) return null;
    const quote: Quote = { price, currency };
    CACHE.set(symbol, { quote, at: Date.now() });
    return quote;
  } catch {
    return null;
  }
}

/** Devuelve un mapa symbol -> Quote (solo los que se han podido resolver). */
export async function getQuotes(symbols: string[]): Promise<Map<string, Quote>> {
  const unique = [...new Set(symbols.filter(Boolean))];
  const out = new Map<string, Quote>();
  const results = await Promise.all(unique.map((s) => fetchOne(s).then((q) => [s, q] as const)));
  for (const [s, q] of results) if (q) out.set(s, q);
  return out;
}
