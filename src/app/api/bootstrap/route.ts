import { NextRequest, NextResponse } from 'next/server';
import { discoverAllPolymarketTraders, bulkImportDiscoveredTraders } from '@/lib/polymarket/discovery';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Bootstrap — Polymarket trader discovery ONLY.
 * 
 * Why not sync here? Vercel Hobby free tier = max 60 sec execution.
 * Sync takes 5-10+ seconds per trader → impossible in 60s.
 * 
 * Solution:
 *   1. Bootstrap discovers + imports wallets only (fast, ~10-20s)
 *   2. Cron job (`/api/cron/refresh-leaderboard`) syncs trust scores
 *      every 5 minutes, processing 200 traders per run
 * 
 * By the time you view the leaderboard, cron has already synced
 * hundreds of traders with real trust scores.
 * 
 * GET /api/bootstrap
 */
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  logger.info('Starting bootstrap (discovery-only phase)...');

  try {
    const startTime = Date.now();

    // Step 1: Fast discovery (30 events per category tag)
    const traders = await discoverAllPolymarketTraders({
      maxWallets: 2000,
      maxEventsPerTag: 30,
    });

    // Step 2: Bulk-import new wallets (skips duplicates via unique constraint)
    const { imported, skipped } = await bulkImportDiscoveredTraders(traders);

    // Step 3: Get total count in DB
    const totalInDb = await prisma.polymarketTrader.count();

    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info(
      { discovered: traders.length, imported, skipped, totalInDb, elapsedSec },
      'Bootstrap complete'
    );

    return NextResponse.json({
      success: true,
      bootstrap: {
        discovered: traders.length,
        imported,
        skipped,
        totalInDb,
        elapsedSec: parseFloat(elapsedSec),
      },
      nextSteps: {
        explanation: 'Cron job will now sync all traders with trust scores automatically every 5 minutes.',
        action: 'Wait 2-5 minutes, then visit /leaderboard to see scores.',
      },
      urls: {
        leaderboard: 'https://niche-trust-platform.vercel.app/leaderboard',
        healthCheck: 'https://niche-trust-platform.vercel.app/api/health',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Bootstrap failed');
    return NextResponse.json(
      { error: 'Bootstrap failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}