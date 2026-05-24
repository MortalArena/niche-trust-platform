const BASE = 'https://api.manifold.markets/v0';

export async function listManifoldMarkets(limit = 20) {
  const res = await fetch(`${BASE}/markets?limit=${limit}`, { next: { revalidate: 120 } });
  if (!res.ok) throw new Error('Manifold API error');
  return res.json();
}

export async function getManifoldBetsByUsername(username: string, limit = 50) {
  const res = await fetch(
    `${BASE}/bets?username=${encodeURIComponent(username)}&limit=${limit}`,
    { next: { revalidate: 60 } }
  );
  if (!res.ok) throw new Error('Manifold bets API error');
  return res.json();
}
