import { NextRequest, NextResponse } from 'next/server';
import { discoverAndImportAll } from '@/lib/polymarket/discovery';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Bootstrap — FULL Polymarket trader discovery + sync.
 * 
 * This does NOT use fake seed wallets. It scans ALL active Polymarket
 * events across ALL categories, finds EVERY trader wallet that has
 * placed a trade, and syncs them all with trust scores.
 * 
 * GET /api/bootstrap?secret=YOUR_SECRET
 * GET /api/bootstrap?secret=YOUR_SECRET&limit=1000
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes — allows full scan

export async function GET(req: NextRequest) {
  // No auth required — this is a public bootstrap endpoint.
  // It takes 2-5 minutes to scan ALL Polymarket events and compute trust scores.

  const limitParam = req.nextUrl.searchParams.get('limit');
  const maxWalletsToSync = limitParam ? parseInt(limitParam) : 500;

  logger.info({ maxWalletsToSync }, 'Starting FULL Polymarket bootstrap...');

  try {
    // STEP 1: Discover ALL traders from Polymarket events (scan all categories)
    const discoveryResult = await discoverAndImportAll();
    
    const { discovered, imported, skipped } = discoveryResult;
    logger.info({ discovered, imported, skipped }, 'Discovery complete. Now syncing traders with trust scores...');

    // STEP 2: Now sync the most recently added traders (highest potential value)
    const tradersToSync = await prisma.polymarketTrader.findMany({
      where: { 
        OR: [
          { trustScore: 0 },
          { lastSyncedAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: maxWalletsToSync,
      select: { proxyWallet: true },
    });

    logger.info({ totalToSync: tradersToSync.length }, 'Syncing discovered traders...');

    let syncedCount = 0;
    let failedCount = 0;

    // Sync in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < tradersToSync.length; i += batchSize) {
      const batch = tradersToSync.slice(i, i + batchSize);
      const results = await Promise.allSettled(
        batch.map(t => syncPolymarketTrader(t.proxyWallet, 'all'))
      );
      
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) syncedCount++;
        else failedCount++;
      }

      // Small delay between batches to be nice to Polymarket API
      if (i + batchSize < tradersToSync.length) {
        await new Promise(r => setTimeout(r, 1000));
      }
    }

    // STEP 3: Trigger leaderboard refresh
    logger.info({ syncedCount, failedCount }, 'Bootstrap fully complete');

    return NextResponse.json({
      success: true,
      discovery: { discovered, imported, skipped, note: 'Scanned ALL Polymarket events across ALL categories' },
      sync: { attempted: tradersToSync.length, syncedCount, failedCount },
      totalInDB: await prisma.polymarketTrader.count(),
      note: `Full bootstrap complete. Synced ${syncedCount} traders with trust scores. Cron will sync the rest every 5 minutes.`,
    });
  } catch (error) {
    logger.error({ error }, 'Bootstrap failed');
    return NextResponse.json({ error: 'Bootstrap failed', details: (error as Error).message }, { status: 500 });
  }
}
