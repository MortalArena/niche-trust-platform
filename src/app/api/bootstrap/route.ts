import { NextResponse } from 'next/server';
import { discoverAllPolymarketTraders, bulkImportDiscoveredTraders } from '@/lib/polymarket/discovery';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

const CATEGORY_TAGS: Record<string, string[]> = {
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
 * GET /api/bootstrap
 * Bootstraps the platform in phases within 60s Vercel Hobby limit:
 *   Phase 1 (fast, ~15s): Import ALL active events per category + recent trades
 *   Phase 2 (queued, async): Cron syncs TrustScores automatically every 5 min
 * 
 * Category inference: events ARE fetched by tag → trader wallets belong to that category
 */
export async function GET() {
  const startTime = Date.now();
  logger.info('Starting bootstrap...');

  try {
    let totalImported = 0;
    let totalSkipped = 0;
    const categoryResults: Record<string, { discovered: number; imported: number; skipped: number }> = {};

    // ── Phase 1: Discover + import per category via event tags ──
    for (const [category, tags] of Object.entries(CATEGORY_TAGS)) {
      const startCat = Date.now();
      const walletsThisCat = new Set<string>();

      for (const tagSlug of tags) {
        if (Date.now() - startTime > 50000) break; // Keep 10s buffer for DB count
        try {
          const { listEvents } = await import('@/lib/polymarket/gamma');
          const events = await listEvents({
            tag_slug: tagSlug,
            limit: 20,
            active: true,
            closed: false,
            order: 'volume24hr',
            ascending: false,
          });
          for (const event of events) {
            const conditions = (event.markets ?? [])
              .map(m => m.conditionId)
              .filter((c): c is string => Boolean(c));
            for (const cid of conditions) {
              try {
                const { dataFetch } = await import('@/lib/polymarket/client');
                const trades: { proxyWallet?: string }[] = [];
                try {
                  const data = await dataFetch<unknown[]>('/trades', { market: cid, limit: 50, takerOnly: false });
                  for (const t of data) {
                    const pw = (t as Record<string, unknown>).proxyWallet;
                    if (typeof pw === 'string' && pw.startsWith('0x') && pw.length === 42) {
                      walletsThisCat.add(pw.toLowerCase());
                    }
                  }
                } catch { /* skip failed condition */ }
              } catch { /* skip */ }
            }
          }
        } catch { /* skip failed tag */ }
      }

      // Bulk import with category assigned
      if (walletsThisCat.size > 0) {
        const wallets = Array.from(walletsThisCat).map(w => ({
          proxyWallet: w,
          categories: [category],
        }));
        const batchSize = 50;
        let imported = 0;
        let skipped = 0;
        for (let i = 0; i < wallets.length; i += batchSize) {
          const batch = wallets.slice(i, i + batchSize);
          try {
            const result = await prisma.polymarketTrader.createMany({
              data: batch.map(w => ({
                proxyWallet: w.proxyWallet,
                categories: w.categories,
                totalTrades: 0,
                lastSyncedAt: new Date(0),
              })),
              skipDuplicates: true,
            });
            imported += result.count;
          } catch {
            for (const w of batch) {
              try {
                await prisma.polymarketTrader.create({
                  data: { proxyWallet: w.proxyWallet, categories: w.categories, totalTrades: 0, lastSyncedAt: new Date(0) },
                });
                imported++;
              } catch { skipped++; }
            }
          }
        }
        categoryResults[category] = { discovered: walletsThisCat.size, imported, skipped };
        totalImported += imported;
        totalSkipped += skipped;
      } else {
        categoryResults[category] = { discovered: 0, imported: 0, skipped: 0 };
      }
      logger.info({ category, wallets: walletsThisCat.size, ms: Date.now() - startCat }, 'Category scanned');
    }

    const totalInDb = await prisma.polymarketTrader.count();
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      bootstrap: {
        categories: categoryResults,
        totalImported,
        totalSkipped,
        totalInDb,
        elapsedSec: parseFloat(elapsedSec),
      },
      nextSteps: {
        leaderboard: 'https://niche-trust-platform.vercel.app/leaderboard',
        note: `Cron syncs TrustScores for all ${totalInDb} traders every 5 min.`,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Bootstrap failed');
    return NextResponse.json({ error: 'Bootstrap failed', details: (error as Error).message }, { status: 500 });
  }
}