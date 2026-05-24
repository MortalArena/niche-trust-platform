'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SyncAnalyzeButton } from '@/components/sync-analyze-button';
import { PolymarketSyncButton } from '@/components/polymarket-sync-button';
import { WalletManager } from '@/components/wallet-manager';
import { ExpertProfileForm } from '@/components/expert-profile-form';
import { AgentKeysManager } from '@/components/agent-keys-manager';

interface DashboardViewProps {
  trustScore: number | null;
  roi: number | null;
  winRate: number | null;
  maxDrawdown: number | null;
  chainBreakdown: Record<string, { trustScore: number; trades: number; txs?: number }> | null;
  walletAddress: string | null;
  expertBalanceUsd?: number;
}

const btnSecondary =
  'rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]';
const btnPrimary = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700';
const card = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm';

export function DashboardView({
  trustScore,
  roi,
  winRate,
  maxDrawdown,
  chainBreakdown,
  walletAddress,
  expertBalanceUsd = 0,
}: DashboardViewProps) {
  const [tab, setTab] = useState<'customer' | 'expert'>('customer');

  return (
    <div>
      <p className="mb-4 font-mono text-sm text-[var(--text-secondary)]">
        {walletAddress ? `Wallet: ${walletAddress.slice(0, 10)}...` : 'Not linked'}
      </p>

      <div className="mb-8 flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-1">
        <button
          type="button"
          onClick={() => setTab('customer')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
            tab === 'customer'
              ? 'bg-blue-600 text-white shadow'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Customer view
        </button>
        <button
          type="button"
          onClick={() => setTab('expert')}
          className={`flex-1 rounded-lg py-2.5 text-sm font-semibold ${
            tab === 'expert'
              ? 'bg-blue-600 text-white shadow'
              : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
          }`}
        >
          Expert view
        </button>
      </div>

      {tab === 'customer' ? (
        <div className="space-y-6">
          <section className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">Find trusted experts</h2>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Browse wallet history scores and verified subscriber star ratings before you pay for
              a private group.
            </p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link href="/experts" className={btnPrimary}>
                Browse experts
              </Link>
              <Link href="/groups" className={btnSecondary}>
                Paid groups
              </Link>
              <Link
                href="/polymarket"
                className="rounded-lg border-2 border-emerald-600 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:bg-emerald-950 dark:text-emerald-200 dark:hover:bg-emerald-900"
              >
                Polymarket markets
              </Link>
              <Link href="/markets" className={btnSecondary}>
                Categories
              </Link>
              <Link href="/platforms" className={btnSecondary}>
                Platforms
              </Link>
            </div>
          </section>

          <section className={card}>
            <h2 className="text-lg font-semibold text-[var(--text-primary)]">How to subscribe</h2>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
              <li>Open a group and pay to the platform wallet (5% fee auto-deducted).</li>
              <li>Paste your payment transaction hash to activate access.</li>
              <li>Leave a 1–5 star review only after you paid (anti-spam).</li>
            </ol>
          </section>
        </div>
      ) : (
        <div className="space-y-6">
          <ExpertProfileForm />
          <AgentKeysManager />

          <div className="rounded-xl border-2 border-emerald-600/40 bg-emerald-50 p-4 dark:bg-emerald-950/40">
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Expert earnings (after 5% platform fee)
            </p>
            <p className="text-2xl font-bold text-[var(--text-primary)]">${expertBalanceUsd.toFixed(2)}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Paid to platform wallet first · 95% credited here · Admin sends on-chain payout
            </p>
          </div>

          {trustScore != null ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard label="Trust Score" value={trustScore.toFixed(1)} highlight />
              <StatCard label="ROI %" value={(roi ?? 0).toFixed(2)} />
              <StatCard label="Win Rate %" value={(winRate ?? 0).toFixed(1)} />
              <StatCard label="Max Drawdown %" value={`-${(maxDrawdown ?? 0).toFixed(1)}`} />
            </div>
          ) : (
            <div className={card}>
              <p className="text-[var(--text-secondary)]">
                No trust score yet. Link Polygon wallet → Sync Polymarket → or Sync all wallets.
              </p>
            </div>
          )}

          {chainBreakdown && Object.keys(chainBreakdown).length > 0 && (
            <div className={card}>
              <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Per-chain breakdown</p>
              <div className="flex flex-wrap gap-2 text-xs">
                {Object.entries(chainBreakdown).map(([chain, data]) => (
                  <span
                    key={chain}
                    className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-2 py-1 font-medium text-[var(--text-primary)]"
                  >
                    {chain}: {data.trustScore.toFixed(0)} · {data.trades} trades
                  </span>
                ))}
              </div>
            </div>
          )}

          <WalletManager />

          <div className="flex flex-wrap items-start gap-4">
            <PolymarketSyncButton />
            <SyncAnalyzeButton />
            <Link href="/publish" className={btnSecondary}>
              Publish prediction
            </Link>
            <Link href="/groups/new" className={btnSecondary}>
              Create paid group
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}>
        {value}
      </p>
    </div>
  );
}
