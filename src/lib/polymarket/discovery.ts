import { listEvents } from '@/lib/polymarket/gamma';
import { getTradesForUser } from '@/lib/polymarket/data';
import { logger } from '@/lib/logger';
import { prisma } from '@/lib/db';

// ─── Types ──────────────────────────────────────────────────────

export interface PolymarketTraderInfo {
  proxyWallet: string;
  name?: string | null;
  tradesCount: number;
  categories: string[];
}

/**
 * Category-to-tag mapping for Polymarket Gamma API discovery.
 */
const CATEGORY_TAG_MAP: Record<string, string[]> = {
  sports:    ['sports', 'nfl', 'nba', 'soccer', 'mlb', 'nhl', 'ufc', 'mma', 'boxing', 'tennis', 'golf', 'cricket'],
  politics:  ['politics', 'us-elections', 'global-elections', 'policy', 'us-politics'],
  crypto:    ['crypto', 'bitcoin', 'ethereum', 'defi', 'nft', 'solana'],
  'science-tech': ['science', 'technology', 'ai', 'space', 'biotech'],
  economics: ['economics', 'finance', 'macro', 'fed', 'equities'],
  culture:   ['culture', 'entertainment', 'awards', 'box-office', 'music'],
  business:  ['business', 'earnings', 'ipo'],
  geopolitics: ['geopolitics', 'diplomacy', 'conflict'],
  'climate-weather': ['climate', 'weather'],
  esports:   ['esports', 'gaming', 'league-of-legends', 'valorant', 'cs2'],
  'world-events': ['world-events', 'breaking-news'],
};

/**
 * 🧠 Discovery Engine
 * 
 * Discovers Polymarket traders by:
 * 1. Fetching top active events for each category tag
 * 2. For each event, fetching its most recent trades
 * 3. Extracting unique proxy wallets
 * 4. Storing them in DB as "discovered" for later sync
 * 
 * This is the ONLY way to find traders since Polymarket has no
 * "list all traders" API endpoint.
 */
export async function discoverPolymarketTraders(options?: {
  categories?: string[];
  eventsPerTag?: number;
  maxTraders?: number;
}): Promise<PolymarketTraderInfo[]> {
  const categories = options?.categories ?? Object.keys(CATEGORY_TAG_MAP);
  const eventsPerTag = options?.eventsPerTag ?? 10;
  const maxTraders = options?.maxTraders ?? 200;

  const discoveredMap = new Map<string, PolymarketTraderInfo>();
  const seenWallets = new Set<string>();

  // First, check if we already have some in DB
  const existingTraders = await prisma.polymarketTrader.findMany({
    select: { proxyWallet: true },
    take: 500,
  });
  for (const t of existingTraders) {
    seenWallets.add(t.proxyWallet);
  }

  for (const categorySlug of categories) {
    const tagSlugs = CATEGORY_TAG_MAP[categorySlug] ?? [categorySlug];
    logger.info({ categorySlug, tags: tagSlugs.length }, 'Discovering traders in category');

    for (const tagSlug of tagSlugs) {
      try {
        const events = await listEvents({
          tag_slug: tagSlug,
          limit: eventsPerTag,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
        });

        // For each event, fetch trades from the Data API
        for (const event of events) {
          const conditions = event.markets
            ?.map(m => m.conditionId)
            .filter((c): c is string => Boolean(c))
            ?? [];

          for (const conditionId of conditions) {
            try {
              // Polymarket Data API supports /trades?condition_id=xxx
              // But our getTradesForUser targets user trades.
              // We need a direct fetch for trades-by-condition.
              const trades = await directFetchTradesByCondition(conditionId, 50);
              
              for (const trade of trades) {
                const wallet = trade.maker?.toLowerCase() ?? trade.taker?.toLowerCase();
                if (!wallet || seenWallets.has(wallet)) continue;

                seenWallets.add(wallet);
                discoveredMap.set(wallet, {
                  proxyWallet: wallet,
                  tradesCount: 1,
                  categories: [tagSlug],
                });

                if (discoveredMap.size >= maxTraders) break;
              }
            } catch {
              // Skip failed condition
            }
            if (discoveredMap.size >= maxTraders) break;
          }
          if (discoveredMap.size >= maxTraders) break;
        }
      } catch {
        // Skip failed tag
      }
      if (discoveredMap.size >= maxTraders) break;
    }
    // Update categories for already-discovered wallets
    // (If we found a trader in multiple categories)
  }

  const discovered = Array.from(discoveredMap.values());
  logger.info({ total: discovered.length }, 'Discovery complete');

  return discovered;
}

/**
 * Direct fetch to Polymarket Data API: /trades?condition_id=xxx
 * Returns raw trade objects with maker/taker addresses.
 */
async function directFetchTradesByCondition(
  conditionId: string,
  limit = 50
): Promise<Array<{ maker?: string; taker?: string; conditionId: string; timestamp: number; side: string; size: number; price: number }>> {
  const url = new URL('https://data-api.polymarket.com/trades');
  url.searchParams.set('condition_id', conditionId);
  url.searchParams.set('limit', String(limit));

  const res = await fetch(url.toString(), {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) return [];
  return res.json();
}

/**
 * Batch-import discovered wallets into the PolymarketTrader table.
 * This seeds the leaderboard with wallets to be synced later.
 */
export async function importDiscoveredTraders(
  traders: PolymarketTraderInfo[]
): Promise<{ imported: number; skipped: number }> {
  let imported = 0;
  let skipped = 0;

  for (const trader of traders) {
    try {
      await prisma.polymarketTrader.create({
        data: {
          proxyWallet: trader.proxyWallet,
          categories: trader.categories,
          totalTrades: 0, // Will be filled on sync
          lastSyncedAt: new Date(0), // Force sync on next cron
        },
      });
      imported++;
    } catch (error: unknown) {
      // Duplicate or constraint error
      skipped++;
    }
  }

  logger.info({ imported, skipped }, 'Imported discovered traders');
  return { imported, skipped };
}

/**
 * API: Discover + Import in one call.
 * Used by the cron job and the seed API.
 */
export async function discoverAndImport(categorySlug?: string): Promise<{
  discovered: number;
  imported: number;
  skipped: number;
}> {
  const categories = categorySlug ? [categorySlug] : undefined;

  const discovered = await discoverPolymarketTraders({
    categories,
    eventsPerTag: 10,
    maxTraders: 200,
  });

  const { imported, skipped } = await importDiscoveredTraders(discovered);

  return {
    discovered: discovered.length,
    imported,
    skipped,
  };
}