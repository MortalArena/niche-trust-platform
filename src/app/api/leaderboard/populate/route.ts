import { NextRequest, NextResponse } from 'next/server';
import { discoverAndImportFast } from '@/lib/polymarket/discovery';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { refreshPrecomputedRankings } from '@/lib/intelligence/rankings';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

function isAuthorized(req: NextRequest): boolean {
  if (process.env.NODE_ENV !== 'production') return true;
  const authHeader = req.headers.get('authorization');
  const apiKey = req.headers.get('x-api-key');
  return (
    authHeader === `Bearer ${process.env.CRON_SECRET}` || apiKey === process.env.CRON_SECRET
  );
}

/**
 * POST /api/leaderboard/populate?sync=50
 * Discover wallets from Polymarket (recent trades + events), import, sync scores, refresh boards.
 * Open in development; CRON_SECRET required in production.
 */
export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const syncParam = req.nextUrl.searchParams.get('sync');
  const syncLimit = Math.min(Number(syncParam) || 20, 50);
  const start = Date.now();

  try {
    const deep = req.nextUrl.searchParams.get('deep') === '1';
    const discovery = deep
      ? await (await import('@/lib/polymarket/discovery')).discoverAndImportAll()
      : await discoverAndImportFast(2500);

    const toSync = await prisma.polymarketTrader.findMany({
      where: {
        OR: [{ totalTrades: 0 }, { edgeScore: 0 }],
      },
      orderBy: { createdAt: 'desc' },
      take: syncLimit,
      select: { proxyWallet: true, categories: true },
    });

    let synced = 0;
    let failed = 0;

    for (let i = 0; i < toSync.length; i += 4) {
      const batch = toSync.slice(i, i + 4);
      const results = await Promise.allSettled(
        batch.map((t) =>
          syncPolymarketTrader(t.proxyWallet, t.categories[0] ?? 'politics')
        )
      );
      for (const r of results) {
        if (r.status === 'fulfilled' && r.value) synced++;
        else failed++;
      }
    }

    const rankings = await refreshPrecomputedRankings().catch((e) => {
      logger.warn({ e }, 'Rankings refresh skipped');
      return {};
    });

    const totalInDB = await prisma.polymarketTrader.count();
    const scored = await prisma.polymarketTrader.count({ where: { totalTrades: { gt: 0 } } });

    return NextResponse.json({
      success: true,
      discovery,
      sync: { attempted: toSync.length, synced, failed },
      rankings,
      totalInDB,
      scored,
      elapsedSec: ((Date.now() - start) / 1000).toFixed(1),
    });
  } catch (error) {
    logger.error({ error }, 'Populate failed');
    return NextResponse.json(
      { error: 'Populate failed', details: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: 'POST /api/leaderboard/populate?sync=50',
    description:
      'Discover Polymarket traders from live trades, import to DB, sync trust/edge scores, refresh ranking boards.',
    auth: process.env.NODE_ENV === 'production' ? 'CRON_SECRET (Bearer or x-api-key)' : 'open in dev',
  });
}
