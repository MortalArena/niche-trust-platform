'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ExpertProfileForm } from '@/components/expert-profile-form';
import { WalletManager } from '@/components/wallet-manager';
import { AgentKeysManager } from '@/components/agent-keys-manager';

/* ─────────── Types ─────────── */
interface DashboardData {
  trustScore: number | null;
  roi: number | null;
  winRate: number | null;
  maxDrawdown: number | null;
  profitFactor: number | null;
  consistency: number | null;
  riskLevel: string;
  totalTrades: number;
  walletAddress: string | null;
  expertBalanceUsd: number;

  // Customer
  activeSubscriptions: number;
  totalSpentUsd: number;
  reviewsGiven: number;
  favoriteExperts: { id: string; name: string; trustScore: number }[];

  // Expert
  totalSubscribers: number;
  activeGroups: number;
  totalPredictions: number;
  predictionResults: { win: number; loss: number; pending: number };
  monthlyEarnings: number;
  lastPayoutUsd: number;
  pendingPayoutUsd: number;

  // Recent activity
  recentActivity: { id: string; type: string; text: string; time: Date }[];
}

interface DashboardFullProps {
  initial: DashboardData;
  userId: string;
  userRole?: string;
}

/* ─────────── Styles ─────────── */
const card = 'rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm';
const cardInner = 'rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] p-4';
const btnPrimary = 'rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700';
const btnSecondary = 'rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]';
const btnDanger = 'rounded-lg border-2 border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 dark:bg-red-950 dark:text-red-300';

/* ─────────── Main Component ─────────── */
export function DashboardFull({ initial, userId, userRole }: DashboardFullProps) {
  const defaultTab = userRole === 'expert' ? 'expert' : userRole === 'subscriber' ? 'customer' : 'overview';
  const [tab, setTab] = useState<'overview' | 'customer' | 'expert'>(defaultTab as 'overview' | 'customer' | 'expert');
  const [data, setData] = useState<DashboardData>(initial);
  const [loading, setLoading] = useState(false);

  // Refresh data periodically
  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r = await fetch('/api/user/dashboard');
        if (r.ok) setData(await r.json());
      } catch { /* noop */ }
    }, 30_000);
    return () => clearInterval(iv);
  }, []);

  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/user/dashboard');
      if (r.ok) setData(await r.json());
    } finally { setLoading(false); }
  };

  return (
    <div>
      {/* ─── Tab Navigation ─── */}
      <div className="mb-8 flex gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-1">
        {(['overview', 'customer', 'expert'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize ${
              tab === t
                ? 'bg-blue-600 text-white shadow'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t === 'overview' ? '📊 Overview' : t === 'customer' ? '🛍️ Buyer Hub' : '🏪 Expert Studio'}
          </button>
        ))}
      </div>

      {/* ─── Refresh ─── */}
      <div className="mb-6 flex items-center justify-between">
        <p className="font-mono text-xs text-[var(--text-muted)]">
          {data.walletAddress ? `${data.walletAddress.slice(0, 10)}…${data.walletAddress.slice(-4)}` : 'Wallet not linked'}
        </p>
        <button type="button" onClick={refresh} disabled={loading} className="rounded-lg border border-[var(--border)] px-3 py-1 text-xs font-medium hover:bg-[var(--surface-hover)]">
          {loading ? '⟳ Refreshing…' : '⟳ Refresh'}
        </button>
      </div>

      {tab === 'overview' && <OverviewTab data={data} />}
      {tab === 'customer' && <CustomerTab data={data} />}
      {tab === 'expert' && <ExpertTab data={data} userId={userId} />}
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   OVERVIEW TAB — Unified snapshot
   ═══════════════════════════════════════════════════ */
function OverviewTab({ data }: { data: DashboardData }) {
  const score = data.trustScore;
  return (
    <div className="space-y-8">
      {/* Trust Score Hero */}
      <div className={`${card} flex flex-col items-center text-center`}>
        <div className={`flex h-24 w-24 items-center justify-center rounded-full text-3xl font-bold ${
          score != null && score >= 70 ? 'bg-emerald-100 text-emerald-700' :
          score != null && score >= 40 ? 'bg-amber-100 text-amber-700' :
          'bg-slate-100 text-slate-500'
        }`}>
          {score != null ? score.toFixed(0) : '—'}
        </div>
        <p className="mt-2 text-sm font-medium text-[var(--text-secondary)]">Trust Score</p>
        {data.totalTrades > 0 && (
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {data.totalTrades} trades · Risk: {data.riskLevel} · {data.activeSubscriptions > 0 && `${data.activeSubscriptions} active subscriptions`}
          </p>
        )}
      </div>

      {/* Quick Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <QuickMetric label="ROI" value={data.roi != null ? `${(data.roi >= 0 ? '+' : '')}${data.roi.toFixed(1)}%` : '—'} positive={data.roi != null && data.roi >= 0} />
        <QuickMetric label="Win Rate" value={data.winRate != null ? `${data.winRate.toFixed(1)}%` : '—'} />
        <QuickMetric label="Drawdown" value={data.maxDrawdown != null ? `${data.maxDrawdown.toFixed(1)}%` : '—'} negative />
        <QuickMetric label="Profit Factor" value={data.profitFactor != null ? data.profitFactor.toFixed(2) : '—'} />
      </div>

      {/* Dual Role Summary */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className={card}>
          <h3 className="font-semibold text-[var(--text-primary)]">🛍️ As a Buyer</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>Active subscriptions: <strong>{data.activeSubscriptions}</strong></p>
            <p>Total spent: <strong>${data.totalSpentUsd.toFixed(2)}</strong></p>
            <p>Reviews given: <strong>{data.reviewsGiven}</strong></p>
          </div>
        </div>
        <div className={card}>
          <h3 className="font-semibold text-[var(--text-primary)]">🏪 As an Expert</h3>
          <div className="mt-3 space-y-2 text-sm">
            <p>Total subscribers: <strong>{data.totalSubscribers}</strong></p>
            <p>Active groups: <strong>{data.activeGroups}</strong></p>
            {data.monthlyEarnings > 0 && <p>This month: <strong className="text-emerald-600">+${data.monthlyEarnings.toFixed(2)}</strong></p>}
            <p>Balance: <strong>${data.expertBalanceUsd.toFixed(2)}</strong></p>
          </div>
        </div>
      </div>

      {/* Recent Activity Feed */}
      {data.recentActivity.length > 0 && (
        <div className={card}>
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">Recent Activity</h3>
          <ul className="space-y-3">
            {data.recentActivity.slice(0, 8).map((a) => (
              <li key={a.id} className="flex items-start gap-3 text-sm">
                <span className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${
                  a.type === 'payment' ? 'bg-emerald-500' :
                  a.type === 'subscription' ? 'bg-blue-500' :
                  a.type === 'prediction' ? 'bg-violet-500' :
                  'bg-slate-400'
                }`} />
                <span className="flex-1 text-[var(--text-secondary)]">{a.text}</span>
                <span className="shrink-0 text-xs text-[var(--text-muted)]">{formatTimeAgo(a.time)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/experts" className={btnPrimary}>Browse experts</Link>
        <Link href="/groups" className={btnSecondary}>Paid groups</Link>
        <Link href="/publish" className={btnSecondary}>Publish prediction</Link>
        <Link href="/groups/new" className={btnSecondary}>Create group</Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   CUSTOMER TAB — Full buyer toolkit
   ═══════════════════════════════════════════════════ */
function CustomerTab({ data }: { data: DashboardData }) {
  return (
    <div className="space-y-8">
      {/* Wallet & Trust */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className={card}>
          <p className="text-xs text-[var(--text-muted)]">Your Trust Score</p>
          <p className="text-2xl font-bold text-blue-600">{data.trustScore != null ? data.trustScore.toFixed(1) : '—'}</p>
        </div>
        <div className={card}>
          <p className="text-xs text-[var(--text-muted)]">Active Subscriptions</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">{data.activeSubscriptions}</p>
        </div>
        <div className={card}>
          <p className="text-xs text-[var(--text-muted)]">Total Spent</p>
          <p className="text-2xl font-bold text-[var(--text-primary)]">${data.totalSpentUsd.toFixed(2)}</p>
        </div>
      </div>

      {/* How to subscribe guide */}
      <div className={card}>
        <h3 className="font-semibold text-[var(--text-primary)]">📋 How to Buy Information</h3>
        <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-[var(--text-secondary)]">
          <li><strong>Browse experts</strong> — check their Wallet Trust Score, Win Rate, and subscriber reviews</li>
          <li><strong>Choose a group</strong> — compare prices, service types, and satisfaction ratings</li>
          <li><strong>Pay to platform wallet</strong> — 5% fee auto-deducted, 95% credited to expert</li>
          <li><strong>Paste payment hash</strong> — access activated instantly + Matrix encrypted chat</li>
          <li><strong>Leave a 1–5 star review</strong> — only after you paid (anti-spam) to help others</li>
        </ol>
      </div>

      {/* Favorite Experts */}
      {data.favoriteExperts.length > 0 && (
        <div className={card}>
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">⭐ Favorite Experts</h3>
          <div className="space-y-3">
            {data.favoriteExperts.map((e) => (
              <Link key={e.id} href={`/trader/${e.id}`} className={`${cardInner} flex items-center justify-between hover:border-blue-400`}>
                <span className="font-medium text-[var(--text-primary)]">{e.name}</span>
                <span className="text-sm text-blue-600">Trust: {e.trustScore.toFixed(0)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/experts" className={btnPrimary}>🔍 Find new experts</Link>
        <Link href="/groups" className={btnSecondary}>📂 Browse groups</Link>
        <Link href="/search" className={btnSecondary}>🔎 Search</Link>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════
   EXPERT TAB — Full seller studio
   ═══════════════════════════════════════════════════ */
function ExpertTab({ data, userId }: { data: DashboardData; userId: string }) {
  const [showProfileForm, setShowProfileForm] = useState(false);
  const [showAgentKeys, setShowAgentKeys] = useState(false);

  return (
    <div className="space-y-8">
      {/* Earnings Hero */}
      <div className="rounded-xl border-2 border-emerald-600/40 bg-emerald-50 p-6 dark:bg-emerald-950/40">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200">
              Available Balance (after 5% platform fee)
            </p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">${data.expertBalanceUsd.toFixed(2)}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-emerald-800 dark:text-emerald-200">Pending payout</p>
            <p className="text-lg font-semibold">${data.pendingPayoutUsd.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2 text-xs text-emerald-700 dark:text-emerald-300">
          <span>Last payout: ${data.lastPayoutUsd.toFixed(2)}</span>
          <span>·</span>
          <span>This month: ${data.monthlyEarnings.toFixed(2)}</span>
          <span>·</span>
          <span>{data.totalSubscribers} total subscribers</span>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800">
            Request payout
          </button>
          <button type="button" className="rounded-lg border-2 border-emerald-600 px-4 py-2 text-sm font-medium text-emerald-800 hover:bg-emerald-100 dark:text-emerald-200">
            View payout history
          </button>
        </div>
      </div>

      {/* Performance Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Wallet Trust" value={data.trustScore != null ? data.trustScore.toFixed(1) : '—'} highlight />
        <StatCard label="ROI" value={data.roi != null ? `${(data.roi >= 0 ? '+' : '')}${data.roi.toFixed(1)}%` : '—'} />
        <StatCard label="Win Rate" value={data.winRate != null ? `${data.winRate.toFixed(1)}%` : '—'} />
        <StatCard label="Risk Level" value={data.riskLevel} />
      </div>

      {/* Prediction Performance */}
      <div className={card}>
        <h3 className="mb-3 font-semibold text-[var(--text-primary)]">📈 Prediction Performance</h3>
        <div className="grid gap-4 sm:grid-cols-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600">{data.predictionResults.win}</p>
            <p className="text-xs text-[var(--text-muted)]">Won</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{data.predictionResults.loss}</p>
            <p className="text-xs text-[var(--text-muted)]">Lost</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-amber-500">{data.predictionResults.pending}</p>
            <p className="text-xs text-[var(--text-muted)]">Pending</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-[var(--text-primary)]">{data.totalPredictions}</p>
            <p className="text-xs text-[var(--text-muted)]">Total</p>
          </div>
        </div>
      </div>

      {/* Subscribers & Groups */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className={card}>
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">👥 Subscribers</h3>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{data.totalSubscribers}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Link href="/groups" className="text-sm font-medium text-blue-600 hover:underline">Manage groups →</Link>
            <Link href="/groups/new" className="text-sm font-medium text-blue-600 hover:underline">Create group →</Link>
          </div>
        </div>
        <div className={card}>
          <h3 className="mb-3 font-semibold text-[var(--text-primary)]">🏪 Groups</h3>
          <p className="text-3xl font-bold text-[var(--text-primary)]">{data.activeGroups}</p>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">Active paid groups</p>
        </div>
      </div>

      {/* Detailed Metrics */}
      {data.consistency != null && (
        <div className={`${card} grid gap-4 sm:grid-cols-3`}>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Consistency</p>
            <p className="text-lg font-semibold">{data.consistency.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Max Drawdown</p>
            <p className="text-lg font-semibold text-red-500">-{data.maxDrawdown?.toFixed(1)}%</p>
          </div>
          <div>
            <p className="text-xs text-[var(--text-muted)]">Profit Factor</p>
            <p className="text-lg font-semibold">{data.profitFactor?.toFixed(2) ?? '—'}</p>
          </div>
        </div>
      )}

      {/* Tools Section */}
      <div className="space-y-4">
        <div className="flex flex-wrap gap-3">
          <button type="button" onClick={() => setShowProfileForm(!showProfileForm)} className={btnPrimary}>
            {showProfileForm ? '✕ Close profile editor' : '✏️ Edit expert profile'}
          </button>
          <button type="button" onClick={() => setShowAgentKeys(!showAgentKeys)} className={btnSecondary}>
            {showAgentKeys ? '✕ Close API keys' : '🔑 Manage agent API keys'}
          </button>
        </div>
        {showProfileForm && <ExpertProfileForm />}
        {showAgentKeys && <AgentKeysManager />}
      </div>

      {/* Wallet Management */}
      <WalletManager />

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3">
        <Link href="/publish" className={btnPrimary}>📝 Publish prediction</Link>
        <Link href="/groups/new" className={btnSecondary}>➕ Create paid group</Link>
        <Link href="/bots" className={btnSecondary}>🤖 Sell bot/strategy</Link>
        <Link href="/dashboard" className={btnSecondary}>📊 Analytics</Link>
      </div>
    </div>
  );
}

/* ─────────── Helper Components ─────────── */
function QuickMetric({ label, value, positive, negative }: { label: string; value: string; positive?: boolean; negative?: boolean }) {
  return (
    <div className={card}>
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`text-xl font-bold ${
        positive ? 'text-emerald-600' :
        negative ? 'text-red-500' :
        'text-[var(--text-primary)]'
      }`}>{value}</p>
    </div>
  );
}

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={card}>
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className={`text-2xl font-bold ${highlight ? 'text-blue-600' : 'text-[var(--text-primary)]'}`}>{value}</p>
    </div>
  );
}

function formatTimeAgo(d: Date): string {
  const sec = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (sec < 60) return 'now';
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}