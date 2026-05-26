import { listEvents } from '@/lib/polymarket/gamma';
import { dataFetch } from '@/lib/polymarket/client';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';
import type { PolymarketTrade } from '@/lib/polymarket/types';

// ─── Types ──────────────────────────────────────────────────────

export interface PolymarketTraderBrief {
  proxyWallet: string;
}

/**
 * Category-to-tag mapping for Polymarket Gamma API discovery.
 * Covers ALL categories and subcategories.
 */
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  sports:    ['sports', 'nfl', 'nba', 'soccer', 'mlb', 'nhl', 'ufc', 'mma', 'boxing', 'tennis', 'golf', 'cricket'],
  politics:  ['politics', 'us-elections', 'global-elections', 'policy', 'us-politics', 'democrats', 'republicans'],
  crypto:    ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'solana', 'memecoin', 'layer1', 'layer2'],
  'science-tech': ['science', 'technology', 'ai', 'space', 'biotech', 'tech'],
  economics: ['economics', 'finance', 'macro', 'fed', 'equities', 'stock-market'],
  culture:   ['culture', 'entertainment', 'awards', 'box-office', 'music', 'movies', 'celebrity'],
  business:  ['business', 'earnings', 'ipo', 'startups'],
  geopolitics: ['geopolitics', 'diplomacy', 'conflict', 'war', 'international'],
  'climate-weather': ['climate', 'weather', 'natural-disaster', 'environment'],
  esports:   ['esports', 'gaming', 'league-of-legends', 'valorant', 'cs2', 'dota2'],
  'world-events': ['world-events', 'breaking-news', 'viral'],
};

/**
 * Fast path: paginate global recent trades (seconds to thousands of wallets).
 * Polymarket Data API uses `market` (condition id) and returns `proxyWallet`.
 */
export async function discoverFromRecentTrades(options?: {
  maxWallets?: number;
  pageSize?: number;
  maxPages?: number;
}): Promise<PolymarketTraderBrief[]> {
  const maxWallets = options?.maxWallets ?? 3000;
  const pageSize = Math.min(options?.pageSize ?? 100, 100);
  const maxPages = options?.maxPages ?? 40;
  const wallets = new Set<string>();

  for (let page = 0; page < maxPages && wallets.size < maxWallets; page++) {
    try {
      const trades = await dataFetch<PolymarketTrade[]>(`/trades`, {
        limit: pageSize,
        offset: page * pageSize,
        takerOnly: false,
      });
      if (!trades.length) break;
      for (const t of trades) {
        const w = t.proxyWallet?.toLowerCase();
        if (w && w.length === 42 && w.startsWith('0x')) wallets.add(w);
        if (wallets.size >= maxWallets) break;
      }
      if (trades.length < pageSize) break;
    } catch (error) {
      logger.warn({ page, error }, 'Recent trades discovery page failed');
      break;
    }
  }

  return Array.from(wallets).map((proxyWallet) => ({ proxyWallet }));
}

async function fetchTradesByCondition(conditionId: string, limit = 100): Promise<PolymarketTrade[]> {
  try {
    return await dataFetch<PolymarketTrade[]>(`/trades`, {
      market: conditionId,
      limit,
      takerOnly: false,
    });
  } catch {
    return [];
  }
}

/**
 * Massive Discovery — fetches ALL traders from ALL active Polymarket events.
 * No artificial limits. Uses batching and pagination for scale.
 * 
 * Returns an array of unique proxy wallet addresses found.
 */
export async function discoverAllPolymarketTraders(options?: {
  maxWallets?: number;
  maxEventsPerTag?: number;
  skipRecentTrades?: boolean;
}): Promise<PolymarketTraderBrief[]> {
  const maxWallets = options?.maxWallets ?? 50000;
  const maxEventsPerTag = options?.maxEventsPerTag ?? 100;
  const discoveredSet = new Set<string>();

  const existingInDb = await prisma.polymarketTrader.findMany({
    select: { proxyWallet: true },
    take: 50000,
  });
  for (const t of existingInDb) discoveredSet.add(t.proxyWallet);

  if (!options?.skipRecentTrades) {
    const recent = await discoverFromRecentTrades({
      maxWallets: Math.min(maxWallets, 5000),
    });
    for (const { proxyWallet } of recent) discoveredSet.add(proxyWallet);
    logger.info({ fromRecentTrades: recent.length, total: discoveredSet.size }, 'Recent trades discovery');
  }

  // Loop through ALL category tags
  const categoryEntries = Object.entries(CATEGORY_TAG_MAP);
  logger.info({ totalTags: categoryEntries.reduce((s, [, v]) => s + v.length, 0) }, 'Starting mass discovery');

  for (const [category, tagSlugs] of categoryEntries) {
    for (const tagSlug of tagSlugs) {
      if (discoveredSet.size >= maxWallets) break;

      try {
        // Fetch MANY events per tag (not just 10)
        const events = await listEvents({
          tag_slug: tagSlug,
          limit: maxEventsPerTag,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
        });

        for (const event of events) {
          if (discoveredSet.size >= maxWallets) break;

          const conditions = event.markets
            ?.map(m => m.conditionId)
            .filter((c): c is string => Boolean(c))
            ?? [];

          for (const conditionId of conditions) {
            if (discoveredSet.size >= maxWallets) break;

            // Get up to 100 trades per condition
            const trades = await fetchTradesByCondition(conditionId, 100);
            for (const trade of trades) {
              const wallet = trade.proxyWallet?.toLowerCase();
              if (wallet && wallet.length === 42) discoveredSet.add(wallet);
              if (discoveredSet.size >= maxWallets) break;
            }
          }
        }
      } catch {
        // Skip failed tag
      }
    }
    if (discoveredSet.size >= maxWallets) break;
  }

  const discovered = Array.from(discoveredSet)
    .filter(w => w && w.length > 10) // Remove invalid wallets
    .map(proxyWallet => ({ proxyWallet }));

  logger.info({ total: discovered.length }, 'Mass discovery complete');
  return discovered;
}

/**
 * Bulk-import discovered wallets into DB using batch inserts.
 * Skips duplicates automatically (unique constraint on proxyWallet).
 */
export async function bulkImportDiscoveredTraders(
  traders: PolymarketTraderBrief[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  // Batch in groups of 50 for performance
  const batchSize = 50;
  for (let i = 0; i < traders.length; i += batchSize) {
    const batch = traders.slice(i, i + batchSize);
    try {
      const result = await prisma.polymarketTrader.createMany({
        data: batch.map(t => ({
          proxyWallet: t.proxyWallet,
          categories: [],
          totalTrades: 0,
          lastSyncedAt: new Date(0), // Force sync on next cron
        })),
        skipDuplicates: true,
      });
      imported += result.count;
      skipped += batch.length - result.count;
    } catch (error: unknown) {
      // Fall back to individual inserts for error recovery
      for (const trader of batch) {
        try {
          await prisma.polymarketTrader.create({
            data: {
              proxyWallet: trader.proxyWallet,
              categories: [],
              totalTrades: 0,
              lastSyncedAt: new Date(0),
            },
          });
          imported++;
        } catch {
          skipped++;
        }
      }
    }
  }

  logger.info({ imported, skipped }, 'Bulk import complete');
  return { imported, skipped };
}

/**
 * API endpoint: Discover ALL traders and import them.
 * No limits. Scans every event across all categories.
 */
/** Fast discovery: recent global trades only (~30s). Use for populate / first load. */
export async function discoverAndImportFast(maxWallets = 2500): Promise<{
  discovered: number;
  imported: number;
  skipped: number;
  note: string;
}> {
  const traders = await discoverFromRecentTrades({ maxWallets, maxPages: 30 });
  const { imported, skipped } = await bulkImportDiscoveredTraders(traders);
  return {
    discovered: traders.length,
    imported,
    skipped,
    note: `Imported ${imported} wallets from recent Polymarket trades. Cron will deep-scan events and sync scores.`,
  };
}

export async function discoverAndImportAll(categorySlug?: string): Promise<{
  discovered: number;
  imported: number;
  skipped: number;
  note: string;
}> {
  logger.info({ categorySlug }, 'Starting full Polymarket trader discovery...');

  const traders = await discoverAllPolymarketTraders();

  const { imported, skipped } = await bulkImportDiscoveredTraders(traders);

  return {
    discovered: traders.length,
    imported,
    skipped,
    note: `Scanned recent trades + events. Found ${traders.length} unique wallets. Imported ${imported} new. Re-run via cron every 5 minutes.`,
  };
}