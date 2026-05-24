'use client';

import { useEffect, useState } from 'react';

interface Stats {
  users: number;
  groups: number;
  activeSubscriptions: number;
  totalVolumeUsd: number;
  platformRevenueUsd: number;
  pendingExpertPayoutsUsd: number;
  reviews: number;
}

interface PendingPayout {
  id: string;
  expertNetUsd: number;
  group: { name: string; owner: { walletAddress: string | null } };
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [pending, setPending] = useState<PendingPayout[]>([]);
  const [payoutSubId, setPayoutSubId] = useState('');
  const [payoutTx, setPayoutTx] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  const load = () => {
    fetch('/api/admin/stats').then((r) => r.json()).then(setStats);
    fetch('/api/admin/payouts')
      .then((r) => r.json())
      .then((d: { pending?: PendingPayout[] }) => setPending(d.pending ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const markPaid = async () => {
    const res = await fetch('/api/admin/payouts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subscriptionId: payoutSubId, payoutTxSig: payoutTx }),
    });
    const d = await res.json();
    if (!res.ok) {
      setMsg(d.error ?? 'Failed');
      return;
    }
    setMsg('Payout recorded');
    setPayoutSubId('');
    setPayoutTx('');
    load();
  };

  return (
    <div className="space-y-8">
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card label="Users" value={String(stats.users)} />
          <Card label="Platform revenue (5%)" value={`$${stats.platformRevenueUsd.toFixed(2)}`} highlight />
          <Card label="Volume" value={`$${stats.totalVolumeUsd.toFixed(2)}`} />
          <Card label="Pending expert payouts" value={`$${stats.pendingExpertPayoutsUsd.toFixed(2)}`} />
        </div>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Expert payouts</h2>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          After you send 95% to the expert on-chain, record the payout tx here.
        </p>
        <div className="mb-4 flex flex-wrap gap-2">
          <input
            placeholder="Subscription ID"
            value={payoutSubId}
            onChange={(e) => setPayoutSubId(e.target.value)}
            className="flex-1 rounded border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <input
            placeholder="Payout tx hash"
            value={payoutTx}
            onChange={(e) => setPayoutTx(e.target.value)}
            className="flex-1 rounded border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <button
            type="button"
            onClick={markPaid}
            className="rounded bg-violet-600 px-4 py-2 text-sm text-white"
          >
            Mark paid
          </button>
        </div>
        {msg && <p className="text-sm text-green-400">{msg}</p>}

        <ul className="mt-4 max-h-64 space-y-2 overflow-y-auto text-sm">
          {pending.map((p) => (
            <li key={p.id} className="rounded border border-[var(--border)] bg-[var(--surface-hover)] p-3 text-[var(--text-secondary)]">
              <span className="font-medium text-[var(--text-primary)]">{p.group.name}</span> · ${Number(p.expertNetUsd)} →{' '}
              {p.group.owner.walletAddress?.slice(0, 12)}...
              <button
                type="button"
                className="ml-2 text-violet-400"
                onClick={() => setPayoutSubId(p.id)}
              >
                Select
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
        <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Integrations</h2>
        <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
          <li>
            <a href="/polymarket" className="text-emerald-400 hover:underline">
              Polymarket
            </a>{' '}
            — live events + expert sync (Data API)
          </li>
          <li>
            <a href="/platforms/manifold" className="text-blue-400 hover:underline">
              Manifold
            </a>{' '}
            — public markets & bets API (play money)
          </li>
          <li>
            <a href="/platforms/kalshi" className="text-cyan-400 hover:underline">
              Kalshi
            </a>{' '}
            — public market data (auth for portfolio)
          </li>
        </ul>
      </section>
    </div>
  );
}

function Card({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-bold ${highlight ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}
