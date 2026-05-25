import { NextRequest, NextResponse } from 'next/server';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { discoverAndImportAll } from '@/lib/polymarket/discovery';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

/**
 * GET /api/cron/refresh-leaderboard
 * 
 * Three-phase refresh:
 * 1. Discover new Polymarket traders from active events (all categories)
 * 2. Sync trust scores for all unsynced traders
 * 3. Refresh scores for known traders synced > 1 hour ago
 * 
 * Protected by CRON_SECRET header. Runs every 5 minutes.
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const phases: Record<string, unknown> = {};

  try {
    // ── Phase 1: Discover new traders ──
    logger.info('Phase 1: Discovering new traders');
    const discovery = await discoverAndImportAll();
    phases.discovery = discovery;

    // ── Phase 2: Sync unsynced traders ──
    logger.info('Phase 2: Syncing unsynced traders');
    const unsynced = await prisma.polymarketTrader.findMany({
      where: {
        OR: [
          { lastSyncedAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } }, // > 1 hour
          { totalTrades: 0 }, // Never synced
        ],
      },
      take: 100,
    });
    phases.unsyncedCount = unsynced.length;

    const syncResults: { wallet: string; category: string; synced: boolean; trustScore?: number; error?: string }[] = [];

    for (let i = 0; i < unsynced.length; i += 3) {
      const batch = unsynced.slice(i, i + 3);
      const batchResults = await Promise.allSettled(
        batch.map(async (trader) => {
          const category = trader.categories[0] ?? 'politics';
          try {
            const brief = await syncPolymarketTrader(trader.proxyWallet, category);
            return {
              wallet: trader.proxyWallet,
              category,
              synced: Boolean(brief),
              trustScore: brief?.trustScore,
            };
          } catch (error) {
            return {
              wallet: trader.proxyWallet,
              category,
              synced: false,
              error: (error as Error).message,
            };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          syncResults.push(result.value);
        }
      }
    }

    phases.sync = {
      attempted: unsynced.length,
      synced: syncResults.filter(r => r.synced).length,
      failed: syncResults.filter(r => !r.synced).length,
    };

    const duration = Date.now() - startTime;
    logger.info({ durationMs: duration, phases }, 'Leaderboard refresh completed');

    return NextResponse.json({
      success: true,
      durationMs: duration,
      phases,
    });
  } catch (error) {
    logger.error({ error }, 'Leaderboard refresh failed');
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}
