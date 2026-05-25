'use client';

import { useEffect, useState, useCallback } from 'react';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';
import type { LeaderboardEntry } from '@/lib/polymarket/leaderboard';

// ─── Types ──────────────────────────────────────────────────────

interface LeaderboardData {
  traders: LeaderboardEntry[];
  total: number;
  category: string;
  updatedAt: string;
}

// ─── Subcategory Definitions (Polymarket-aligned) ───────────────

const SUBCATEGORIES: Record<string, string[]> = {
  sports:    ['sports', 'nfl', 'nba', 'soccer', 'mlb', 'nhl', 'ufc', 'mma', 'boxing', 'tennis', 'golf', 'cricket'],
  politics:  ['politics', 'us-elections', 'global-elections', 'policy', 'us-politics'],
  crypto:    ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'solana'],
  economics: ['economics', 'macro', 'fed', 'equities', 'finance'],
  culture:   ['culture', 'entertainment', 'awards', 'box-office', 'music'],
};

const SUBCATEGORY_LABELS: Record<string, string> = {
  sports:           'All Sports',
  nfl:              '🏈 NFL',
  nba:              '🏀 NBA',
  soccer:           '⚽ Soccer',
  mlb:              '⚾ MLB',
  nhl:              '🏒 NHL',
  ufc:              '🥊 MMA / UFC',
  politics:         'All Politics',
  'us-elections':   '🇺🇸 US Elections',
  'global-elections': '🌍 Global Elections',
  crypto:           'All Crypto',
  bitcoin:          '₿ Bitcoin',
  ethereum:         '⟠ Ethereum',
  solana:           '◎ Solana',
  economics:        'All Economics',
  macro:            '📊 Macro',
  fed:              '🏦 Fed & Rates',
  equities:         '📈 Equities',
  culture:          'All Culture',
  awards:           '🏆 Awards Shows',
  'box-office':     '🎬 Box Office',
};

// ─── Helpers ────────────────────────────────────────────────────

function getSubcategorySlugs(categorySlug: string): string[] {
  return SUBCATEGORIES[categorySlug] ?? [categorySlug];
}

function getCategoryBySubcategory(subSlug: string): string | null {
  for (const [cat, subs] of Object.entries(SUBCATEGORIES)) {
    if (subs.includes(subSlug)) return cat;
  }
  return null;
}

// ─── Main Component ─────────────────────────────────────────────

export default function PolymarketLeaderboardPage() {
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedSubcategory, setSelectedSubcategory] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (category: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = category === 'all'
        ? '/api/leaderboard/traders?limit=100'
        : `/api/leaderboard/traders?category=${category}&limit=100`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount + auto-refresh
  useEffect(() => {
    fetchLeaderboard(selectedCategory === 'all' ? '' : selectedCategory);
  }, [selectedCategory, fetchLeaderboard]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchLeaderboard(selectedCategory === 'all' ? '' : selectedCategory);
    }, 5 * 60 * 1000); // every 5 minutes
    return () => clearInterval(interval);
  }, [selectedCategory, autoRefresh, fetchLeaderboard]);

  // Filter traders by search + subcategory
  const filteredTraders = (data?.traders ?? []).filter((entry) => {
    const t = entry.trader;
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = t.displayName?.toLowerCase().includes(q) ?? false;
      const matchesWallet = t.proxyWallet.toLowerCase().includes(q);
      const matchesPseudonym = t.pseudonym?.toLowerCase().includes(q) ?? false;
      if (!matchesName && !matchesWallet && !matchesPseudonym) return false;
    }
    // Subcategory filter (client-side since Polymarket data API returns all trades)
    if (selectedSubcategory && selectedCategory !== 'all') {
      // Filter by category match
      if (!t.categories.some(c => c === selectedSubcategory || c === selectedCategory)) {
        return false;
      }
    }
    return true;
  });

  const currentCategory = MARKET_CATEGORIES.find(c => c.slug === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-700 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
          <h1 className="text-3xl sm:text-4xl font-bold">🏆 Polymarket Leaderboard</h1>
          <p className="mt-3 text-blue-100 text-lg max-w-3xl">
            Top traders ranked by verified performance. Sourced from Polymarket data API. 
            Updated every 5 minutes.
          </p>
          {data && (
            <p className="mt-2 text-sm text-blue-200">
              {data.total} traders tracked across all categories
              {data.updatedAt && ` • Last updated: ${new Date(data.updatedAt).toLocaleTimeString()}`}
            </p>
          )}
        </div>
      </div>

      {/* Filters Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap gap-3 items-center">
          {/* Category Filter */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedCategory('all'); setSelectedSubcategory(''); }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              🌐 All
            </button>
            {MARKET_CATEGORIES.filter(c => c.slug in SUBCATEGORIES).map((cat) => (
              <button
                key={cat.slug}
                onClick={() => { setSelectedCategory(cat.slug); setSelectedSubcategory(''); }}
                className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                  selectedCategory === cat.slug
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <input
              type="text"
              placeholder="🔍 Search by name, pseudonym, or wallet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Auto-refresh toggle */}
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            Auto-refresh (5m)
          </label>
        </div>

        {/* Subcategory pills */}
        {selectedCategory !== 'all' && SUBCATEGORIES[selectedCategory] && (
          <div className="flex flex-wrap gap-2 mt-3">
            {SUBCATEGORIES[selectedCategory].map((subSlug) => (
              <button
                key={subSlug}
                onClick={() => setSelectedSubcategory(selectedSubcategory === subSlug ? '' : subSlug)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                  selectedSubcategory === subSlug
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
                }`}
              >
                {SUBCATEGORY_LABELS[subSlug] ?? subSlug}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        {/* Loading State */}
        {loading && (
          <div className="text-center py-20">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 text-gray-500">Loading leaderboard...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="text-center py-20">
            <p className="text-red-500 text-lg">⚠️ {error}</p>
            <button
              onClick={() => fetchLeaderboard(selectedCategory)}
              className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && filteredTraders.length === 0 && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📡</div>
            <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">Syncing Traders...</h2>
            <p className="mt-2 text-gray-500">
              {data?.traders.length === 0
                ? 'No traders synced yet. Run the seed API to populate the leaderboard.'
                : 'No traders match your current filters.'}
            </p>
            {data?.traders.length === 0 && (
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    await fetch('/api/leaderboard/seed', { method: 'POST' });
                    await fetchLeaderboard(selectedCategory);
                  } catch {
                    setError('Failed to seed traders');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition shadow-lg"
              >
                🚀 Seed Top Traders Now
              </button>
            )}
          </div>
        )}

        {/* Trader Cards */}
        {!loading && filteredTraders.length > 0 && (
          <div className="space-y-3">
            {filteredTraders.map((entry) => {
              const t = entry.trader;
              const scoreColor = t.trustScore >= 80 ? 'text-green-600' : t.trustScore >= 50 ? 'text-yellow-600' : 'text-red-600';
              const riskColor = t.riskLevel === 'LOW' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                : t.riskLevel === 'HIGH' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';

              return (
                <div key={t.proxyWallet}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 sm:p-5 hover:shadow-md transition group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* Rank */}
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white flex items-center justify-center font-bold text-lg">
                      {entry.rank}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900 dark:text-white text-lg truncate">
                          {t.displayName || t.pseudonym || 'Anonymous Trader'}
                        </h3>
                        {t.verifiedBadge && (
                          <span className="text-blue-500" title="Verified">✅</span>
                        )}
                        {t.xUsername && (
                          <a
                            href={`https://x.com/${t.xUsername.replace('@', '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline"
                          >
                            @{t.xUsername.replace('@', '')}
                          </a>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mt-1">
                        {t.proxyWallet.slice(0, 10)}...{t.proxyWallet.slice(-8)}
                      </p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${riskColor}`}>
                          {t.riskLevel}
                        </span>
                        {t.categories.slice(0, 3).map((cat) => (
                          <span key={cat} className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-4 sm:gap-6 items-center">
                      <div className="text-center min-w-[60px]">
                        <div className={`text-xl font-bold ${scoreColor}`}>{t.trustScore.toFixed(1)}</div>
                        <div className="text-xs text-gray-500">Trust Score</div>
                      </div>
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                          {t.winRate.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">Win Rate</div>
                      </div>
                      <div className="text-center min-w-[50px]">
                        <div className={`text-lg font-semibold ${t.roi >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {t.roi >= 0 ? '+' : ''}{t.roi.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-500">ROI</div>
                      </div>
                      <div className="text-center min-w-[50px]">
                        <div className="text-lg font-semibold text-gray-700 dark:text-gray-300">{t.totalTrades}</div>
                        <div className="text-xs text-gray-500">Trades</div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      {t.polymarketUrl && (
                        <a
                          href={t.polymarketUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 text-xs font-medium bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg hover:from-blue-600 hover:to-purple-700 transition"
                        >
                          View on Polymarket ↗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer info */}
        {data && data.traders.length > 0 && (
          <p className="text-center text-xs text-gray-400 mt-6">
            Data sourced from Polymarket Gamma + Data API. TrustScore computed using weighted formula: 
            30% ROI + 25% Consistency + 25% Risk Control + 20% Activity. Updated every 5 minutes.
          </p>
        )}
      </div>
    </div>
  );
}