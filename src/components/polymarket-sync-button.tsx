'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function PolymarketSyncButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sync = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch('/api/polymarket/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Sync failed');
        return;
      }
      setResult(
        `Polymarket: ${data.tradeCount} trades, ${data.openPositions} positions · Trust ${Number(data.trustScore ?? 0).toFixed(1)}`
      );
      router.refresh();
    } catch {
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-[200px]">
      <button
        type="button"
        onClick={sync}
        disabled={loading}
        className="w-full rounded-lg border-2 border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {loading ? 'Syncing Polymarket…' : 'Sync from Polymarket API'}
      </button>
      {result && <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{result}</p>}
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
