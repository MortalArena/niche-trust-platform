'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function SyncAnalyzeButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSyncAnalyze = async () => {
    setLoading(true);
    setError(null);
    setStatus('Syncing all linked wallets (per chain)...');

    try {
      const res = await fetch('/api/wallet/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ syncAll: true, limit: 300 }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Analysis failed');
        setStatus(null);
        return;
      }

      setStatus(
        `Done: ${data.transactionCount ?? 0} txs | Trust Score: ${Number(data.trustScore ?? 0).toFixed(1)}`
      );
      router.refresh();
    } catch {
      setError('Connection error — is Docker (Postgres) running?');
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-w-[200px]">
      <button
        type="button"
        onClick={handleSyncAnalyze}
        disabled={loading}
        className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Syncing & analyzing…' : 'Sync all wallets & analyze'}
      </button>
      {status && <p className="mt-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">{status}</p>}
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
