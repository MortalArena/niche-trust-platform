'use client';

import { useState } from 'react';

export function MatrixSetupBanner({ onSaved }: { onSaved?: () => void }) {
  const [matrixUserId, setMatrixUserId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const save = async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/user/matrix', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ matrixUserId: matrixUserId.trim() }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? 'Invalid Matrix ID');
      setLoading(false);
      return;
    }
    setDone(true);
    onSaved?.();
    setLoading(false);
  };

  if (done) {
    return (
      <div className="mb-4 rounded-lg border border-emerald-600/40 bg-emerald-50 p-4 text-sm text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        Matrix ID saved. Refresh the page — you will be invited to the encrypted room automatically after payment.
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-xl border-2 border-violet-500/40 bg-violet-50 p-4 dark:bg-violet-950/30">
      <h3 className="font-semibold text-[var(--text-primary)]">Connect encrypted chat (Matrix)</h3>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Private group chat uses Matrix E2EE (Megolm). Enter your Matrix ID so we can invite you to the
        secret room after you subscribe.
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={matrixUserId}
          onChange={(e) => setMatrixUserId(e.target.value)}
          placeholder="@username:your.server"
          className="min-w-[240px] flex-1 rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={save}
          disabled={loading}
          className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
        >
          {loading ? 'Saving…' : 'Save Matrix ID'}
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
    </div>
  );
}
