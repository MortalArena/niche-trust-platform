const BASE = 'https://api.elections.kalshi.com/trade-api/v2';

/** Public market data — no auth (docs: quick_start_market_data) */
export async function listKalshiMarkets(limit = 20, status = 'open') {
  const url = new URL(`${BASE}/markets`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('status', status);

  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) {
    const alt = await fetch(
      `https://trading-api.kalshi.com/trade-api/v2/markets?limit=${limit}&status=${status}`
    );
    if (!alt.ok) throw new Error('Kalshi API unavailable');
    return alt.json();
  }
  return res.json();
}

export async function listKalshiEvents(limit = 20, status = 'open') {
  const url = new URL(`${BASE}/events`);
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('status', status);
  const res = await fetch(url.toString(), { cache: 'no-store' });
  if (!res.ok) throw new Error('Kalshi events API error');
  return res.json();
}
