import { NextRequest, NextResponse } from 'next/server';
import { discoverAllPolymarketTraders, bulkImportDiscoveredTraders } from '@/lib/polymarket/discovery';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Bootstrap — Polymarket trader discovery + initial sync.
 * 
 * Vercel Hobby plan time limit: ~60 seconds.
 * This endpoint does:
 *   1. FAST discovery (scan events, collect wallet addresses)
 *   2. Import only (no trust score sync — cron handles that)
 *   3. Optionally sync a small batch of traders for immediate visibility
 * 
 * GET /api/bootstrap
 * GET /api/bootstrap?limit=50   (sync first N traders)
 * GET /api/bootstrap?sync=10    (discover + sync first 10)
 */

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req: NextRequest) {
  const limitParam = req.nextUrl.searchParams.get('limit');
  const syncParam = req.nextUrl.searchParams.get('sync');
  
  const syncCount = syncParam ? parseInt(syncParam) : 0;
  const maxEventsPerTag = 30; // Smaller for speed

  logger.info({ syncCount, maxEventsPerTag }, 'Starting bootstrap...');

  try {
    // Record start time
    const startTime = Date.now();
    
    // STEP 1: Discover ALL traders (scan events, extract wallets)
    const traders = await discoverAllPolymarketTraders({ maxWallets: 1000, maxEventsPerTag });
    
    // STEP 2: Import newly discovered wallets into DB
    const { imported, skipped } = await bulkImportDiscoveredTraders(traders);
    
    // STEP 3: Optionally sync a small batch for immediate leaderboard data
    let synced = 0;
    let failed = 0;
    if (syncCount > 0) {
      const toSync = await prisma.polymarketTrader.findMany({
        where: { trustScore: 0 },
        orderBy: { createdAt: 'desc' },
        take: Math.min(syncCount, 20), // Hard cap of 20 for Vercel free tier
        select: { proxyWallet: true },
      });
      
      // Sync without delays (faster)
      const results = await Promise.allSettled(
        toSync.map(t => syncPolymarketTrader(t.proxyWallet, 'all').catch(() => null))
      );
      synced = results.filter(r => r.status === 'fulfilled' && r.value).length;
      failed = results.filter(r => r.status === 'rejected' || !r.value).length;
    }
    
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

    logger.info({ discovered: traders.length, imported, skipped, synced, failed, elapsedSec: elapsed }, 'Bootstrap complete');

    return NextResponse.json({
      success: true,
      bootstrap: {
        discovered: traders.length,
        imported,
        skipped,
        synced,
        failed,
        elapsedSec: parseFloat(elapsed),
      },
      totalInDB: await prisma.polymarketTrader.count(),
      nextStep: 'Cron job will sync all remaining traders with trust scores every 5 minutes.',
      urls: {
        leaderboard: 'https://niche-trust-platform.vercel.app/leaderboard',
        cronRefresh: 'https://niche-trust-platform.vercel.app/api/cron/refresh-leaderboard',
      },
    });
  } catch (error) {
    logger.error({ error }, 'Bootstrap failed');
    return NextResponse.json({ error: 'Bootstrap failed', details: (error as Error).message }, { status: 500 });
  }
}