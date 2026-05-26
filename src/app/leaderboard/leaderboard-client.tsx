'use client';

import Link from 'next/link';
import { useEffect, useState, useCallback } from 'react';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';
import {
  RANKING_BOARDS,
  RANKING_BOARD_LABELS,
  type RankingBoardId,
} from '@/lib/intelligence/edge-score';
import type { LeaderboardEntry } from '@/lib/polymarket/leaderboard';

interface LeaderboardData {
  traders: LeaderboardEntry[];
  total: number;
  category: string;
  board: RankingBoardId;
  source: 'precomputed' | 'live';
  updatedAt: string;
}

const SUBCATEGORIES: Record<string, string[]> = {
  sports: ['sports', 'nfl', 'nba', 'soccer', 'mlb', 'nhl', 'ufc', 'mma', 'boxing', 'tennis', 'golf', 'cricket'],
  politics: ['politics', 'us-elections', 'global-elections', 'policy', 'us-politics'],
  crypto: ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'solana'],
  economics: ['economics', 'macro', 'fed', 'equities', 'finance'],
  culture: ['culture', 'entertainment', 'awards', 'box-office', 'music'],
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  sports: 'All Sports',
  nfl: 'NFL',
  nba: 'NBA',
  soccer: 'Soccer',
  politics: 'All Politics',
  'us-elections': 'US Elections',
  crypto: 'All Crypto',
  bitcoin: 'Bitcoin',
  ethereum: 'Ethereum',
  economics: 'All Economics',
  macro: 'Macro',
  culture: 'All Culture',
};

function edgeColor(score: number): string {
  if (score >= 75) return 'text-emerald-500';
  if (score >= 50) return 'text-amber-500';
  return 'text-[var(--text-secondary)]';
}

export function LeaderboardClient() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBoard, setSelectedBoard] = useState<RankingBoardId>('top_edge');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchLeaderboard = useCallback(async (board: RankingBoardId, category: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ board, limit: '100' });
      if (category && category !== 'all') params.set('category', category);
      const res = await fetch(`/api/intelligence/rankings?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData({
        traders: json.traders ?? [],
        total: json.total ?? 0,
        category: json.category ?? 'all',
        board: json.board ?? board,
        source: json.source ?? 'live',
        updatedAt: json.updatedAt ?? new Date().toISOString(),
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const cat = selectedCategory === 'all' ? '' : selectedCategory;
    fetchLeaderboard(selectedBoard, cat);
  }, [selectedBoard, selectedCategory, fetchLeaderboard]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const cat = selectedCategory === 'all' ? '' : selectedCategory;
      fetchLeaderboard(selectedBoard, cat);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedBoard, selectedCategory, autoRefresh, fetchLeaderboard]);

  const filteredTraders = (data?.traders ?? []).filter((entry) => {
    const t = entry.trader;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = t.displayName?.toLowerCase().includes(q) ?? false;
      const matchesWallet = t.proxyWallet.toLowerCase().includes(q);
      const matchesPseudonym = t.pseudonym?.toLowerCase().includes(q) ?? false;
      if (!matchesName && !matchesWallet && !matchesPseudonym) return false;
    }
    if (selectedSubcategory && selectedCategory !== 'all') {
      if (!t.categories.some((c) => c === selectedSubcategory || c === selectedCategory)) {
        return false;
      }
    }
    return true;
  });

  const boardMeta = RANKING_BOARD_LABELS[selectedBoard];

  return (
    <div>
      <div className="mb-8 rounded-2xl border border-[var(--border)] bg-gradient-to-br from-[var(--surface)] to-[var(--bg)] p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
          Intelligence Engine
        </p>
        <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
          Polymarket wallet rankings
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Bloomberg-style reputation for prediction traders. Precomputed every 5 minutes from
          Polymarket trades and closed positions — not raw blockchain noise.
        </p>
        {data && (
          <p className="mt-3 text-xs text-[var(--text-secondary)]">
            {data.total} wallets tracked · {data.source === 'precomputed' ? 'cached board' : 'live query'}
            {data.updatedAt && ` · Updated ${new Date(data.updatedAt).toLocaleString()}`}
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {RANKING_BOARDS.map((board) => (
          <button
            key={board}
            type="button"
            onClick={() => setSelectedBoard(board)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition ${
              selectedBoard === board
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] bg-[var(--surface)] text-[var(--text-secondary)] hover:border-[var(--accent)]'
            }`}
          >
            {RANKING_BOARD_LABELS[board].label}
          </button>
        ))}
      </div>
      <p className="mb-4 text-xs text-[var(--text-secondary)]">{boardMeta.description}</p>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSelectedSubcategory('');
            }}
            className={`rounded-full px-3 py-1.5 text-sm ${
              selectedCategory === 'all'
                ? 'bg-[var(--accent)] text-white'
                : 'border border-[var(--border)] text-[var(--text-secondary)]'
            }`}
          >
            All markets
          </button>
          {MARKET_CATEGORIES.filter((c) => c.slug in SUBCATEGORIES).map((cat) => (
            <button
              key={cat.slug}
              type="button"
              onClick={() => {
                setSelectedCategory(cat.slug);
                setSelectedSubcategory('');
              }}
              className={`rounded-full px-3 py-1.5 text-sm ${
                selectedCategory === cat.slug
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="Search wallet or name…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="min-w-[200px] flex-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)] outline-none focus:ring-2 focus:ring-[var(--accent)]"
        />
        <label className="flex cursor-pointer items-center gap-2 text-xs text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          Auto-refresh (5m)
        </label>
      </div>

      {selectedCategory !== 'all' && SUBCATEGORIES[selectedCategory] && (
        <div className="mb-4 flex flex-wrap gap-2">
          {SUBCATEGORIES[selectedCategory].map((subSlug) => (
            <button
              key={subSlug}
              type="button"
              onClick={() =>
                setSelectedSubcategory(selectedSubcategory === subSlug ? '' : subSlug)
              }
              className={`rounded-full px-2.5 py-1 text-xs ${
                selectedSubcategory === subSlug
                  ? 'bg-[var(--accent)] text-white'
                  : 'border border-[var(--border)] text-[var(--text-secondary)]'
              }`}
            >
              {SUBCATEGORY_LABELS[subSlug] ?? subSlug}
            </button>
          ))}
        </div>
      )}

      {loading && (
        <div className="py-16 text-center text-[var(--text-secondary)]">Loading rankings…</div>
      )}

      {error && (
        <div className="py-16 text-center">
          <p className="text-red-500">{error}</p>
          <button
            type="button"
            onClick={() =>
              fetchLeaderboard(
                selectedBoard,
                selectedCategory === 'all' ? '' : selectedCategory
              )
            }
            className="mt-4 rounded-lg bg-[var(--accent)] px-4 py-2 text-sm text-white"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filteredTraders.length === 0 && (
        <div className="rounded-xl border border-dashed border-[var(--border)] py-16 text-center">
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">Building trader index…</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-[var(--text-secondary)]">
            Polymarket has no &quot;list all users&quot; API. We discover wallets from live trades and events,
            then score them. Click below once — takes 1–3 minutes locally.
          </p>
          <button
            type="button"
            onClick={async () => {
              try {
                setLoading(true);
                setError(null);
                const d1 = await fetch('/api/leaderboard/populate?discoverOnly=1', { method: 'POST' });
                const j1 = await d1.json().catch(() => ({}));
                if (!d1.ok) throw new Error(j1.error ?? 'Discovery failed');
                const d2 = await fetch('/api/leaderboard/populate?syncOnly=1&sync=25', {
                  method: 'POST',
                });
                const j2 = await d2.json().catch(() => ({}));
                if (!d2.ok) throw new Error(j2.error ?? 'Scoring failed');
                await fetchLeaderboard(
                  selectedBoard,
                  selectedCategory === 'all' ? '' : selectedCategory
                );
              } catch (e) {
                setError((e as Error).message);
              } finally {
                setLoading(false);
              }
            }}
            className="mt-4 rounded-lg bg-[var(--accent)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            Discover &amp; score traders now
          </button>
        </div>
      )}

      {!loading && filteredTraders.length > 0 && (
        <div className="space-y-2">
          {filteredTraders.map((entry) => {
            const t = entry.trader;
            const riskClass =
              t.riskLevel === 'LOW'
                ? 'bg-emerald-500/10 text-emerald-600'
                : t.riskLevel === 'HIGH'
                  ? 'bg-red-500/10 text-red-600'
                  : 'bg-amber-500/10 text-amber-600';

            return (
              <Link
                key={t.proxyWallet}
                href={`/trader/${t.proxyWallet}`}
                className="flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-[var(--accent)] sm:flex-row sm:items-center"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-lg font-bold text-white">
                  {entry.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold text-[var(--text-primary)]">
                      {t.displayName || t.pseudonym || 'Anonymous'}
                    </span>
                    {t.verifiedBadge && <span title="Verified">✓</span>}
                  </div>
                  <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
                    {t.proxyWallet.slice(0, 8)}…{t.proxyWallet.slice(-6)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    <span className={`rounded-full px-2 py-0.5 text-xs ${riskClass}`}>
                      {t.riskLevel} risk
                    </span>
                    {t.categories.slice(0, 3).map((cat) => (
                      <span
                        key={cat}
                        className="rounded-full bg-[var(--bg)] px-2 py-0.5 text-xs text-[var(--text-secondary)]"
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-wrap gap-5 sm:gap-6">
                  <div className="text-center">
                    <div className={`text-xl font-bold ${edgeColor(t.edgeScore)}`}>
                      {t.edgeScore.toFixed(1)}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Edge</div>
                  </div>
                  <div className="text-center">
                    <div
                      className={`text-lg font-semibold ${t.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`}
                    >
                      {t.roi >= 0 ? '+' : ''}
                      {t.roi.toFixed(1)}%
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">ROI</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      {t.winRate.toFixed(0)}%
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Win</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      ${(t.totalVolumeUsd / 1000).toFixed(0)}k
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Volume</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-semibold text-[var(--text-primary)]">
                      {t.totalTrades}
                    </div>
                    <div className="text-xs text-[var(--text-secondary)]">Trades</div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {data && data.traders.length > 0 && (
        <p className="mt-8 text-center text-xs text-[var(--text-secondary)]">
          Edge Score = 40% ROI + 25% consistency + 15% risk + 10% timing + 10% volume.{' '}
          <Link href="/learn/intelligence-engine" className="text-[var(--accent)] hover:underline">
            How it works
          </Link>
        </p>
      )}
    </div>
  );
}
