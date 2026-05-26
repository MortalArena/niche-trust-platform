import { NextResponse } from 'next/server';
import { discoverAllPolymarketTraders, discoverAndImportAll, bulkImportDiscoveredTraders } from '@/lib/polymarket/discovery';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/**
 * POST /api/populate
 * Full populate: mass discovery + import (all 11 categories).
 * Run once manually via: curl -X POST http://localhost:3000/api/populate
 */
export async function POST() {
  const startTime = Date.now();
  logger.info('Starting full populate...');

  try {
    // ── Phase 1: Fast recent trades (discoverAndImportAll uses both recent + events) ──
    const fast = await discoverAndImportAll();
    logger.info({ fast }, 'Fast import done');

    // ── Phase 2: Deep category-aware discovery (all tags, no limits) ──
    const allTraders = await discoverAllPolymarketTraders({
      maxWallets: 50000,
      maxEventsPerTag: 100,
    });
    const deepImport = await bulkImportDiscoveredTraders(allTraders);
    logger.info({ deepImport }, 'Deep discovery import done');

    const totalInDb = await prisma.polymarketTrader.count();
    const unsynced = await prisma.polymarketTrader.count({
      where: { lastSyncedAt: { equals: new Date(0) } },
    });
    const elapsedSec = ((Date.now() - startTime) / 1000).toFixed(1);

    return NextResponse.json({
      success: true,
      populate: {
        fastDiscovered: fast.discovered,
        fastImported: fast.imported,
        deepDiscovered: allTraders.length,
        deepImported: deepImport.imported,
        totalInDb,
        unsynced,
        elapsedSec: parseFloat(elapsedSec),
      },
      next: {
        action: 'Cron will sync all traders with TrustScores every 5 minutes.',
        manualSync: 'curl http://localhost:3000/api/cron/refresh-leaderboard',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Populate failed');
    return NextResponse.json(
      { error: 'Populate failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}