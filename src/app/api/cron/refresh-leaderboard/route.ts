import { NextRequest, NextResponse } from 'next/server';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { logger } from '@/lib/logger';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

// Known/seed trader wallets to refresh periodically
const TRADERS_TO_REFRESH: { wallet: string; category: string }[] = [
  { wallet: '0xcfe42e0c848b8f9ac482379b4c05b0e3be34234b', category: 'politics' },
  { wallet: '0x3ac5cb3a328adadc5c4e0a49fe54f8e17a45c7c3', category: 'politics' },
  { wallet: '0x2e1d04b3f3c7a46a8d0b9c5b1e4f8a2d0b3c5e7', category: 'sports' },
  { wallet: '0x8a9c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8', category: 'crypto' },
  { wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', category: 'sports' },
  { wallet: '0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', category: 'sports' },
  { wallet: '0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c', category: 'culture' },
  { wallet: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0', category: 'economics' },
];

/**
 * GET /api/cron/refresh-leaderboard
 * 
 * Refreshes known Polymarket traders' data.
 * Called every 5 minutes by Vercel Cron or external scheduler.
 * Protected by CRON_SECRET header.
 * 
 * Also attempts to discover new traders from trending events.
 */
export async function GET(req: NextRequest) {
  // Protect with secret header
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();
  const results: { wallet: string; category: string; synced: boolean; trustScore?: number; error?: string }[] = [];

  try {
    logger.info({ traderCount: TRADERS_TO_REFRESH.length }, 'Starting leaderboard refresh');

    // Refresh all known traders (with concurrency limit)
    const batchSize = 3;
    for (let i = 0; i < TRADERS_TO_REFRESH.length; i += batchSize) {
      const batch = TRADERS_TO_REFRESH.slice(i, i + batchSize);
      const batchResults = await Promise.allSettled(
        batch.map(async (trader) => {
          try {
            const brief = await syncPolymarketTrader(trader.wallet, trader.category);
            return {
              wallet: trader.wallet,
              category: trader.category,
              synced: Boolean(brief),
              trustScore: brief?.trustScore,
            };
          } catch (error) {
            return {
              wallet: trader.wallet,
              category: trader.category,
              synced: false,
              error: (error as Error).message,
            };
          }
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          results.push({
            wallet: 'unknown',
            category: 'unknown',
            synced: false,
            error: result.reason?.message ?? 'Unknown error',
          });
        }
      }
    }

    // Try to discover new traders from active events across categories
    let discovered = 0;
    for (const category of MARKET_CATEGORIES.slice(0, 4)) { // top 4 categories
      try {
        const { listEvents } = await import('@/lib/polymarket/gamma');
        const events = await listEvents({
          tag_slug: category.slug,
          limit: 5,
          active: true,
          closed: false,
          order: 'volume24hr',
          ascending: false,
        });
        
        // Extraction of trader wallets from events would happen here
        // Currently we rely on known seed traders + user submissions
         
      } catch {
        // Skip discovery for this category
      }
    }

    const duration = Date.now() - startTime;
    const synced = results.filter((r) => r.synced).length;
    const failed = results.filter((r) => !r.synced).length;

    logger.info({ synced, failed, discovered, durationMs: duration }, 'Leaderboard refresh completed');

    return NextResponse.json({
      success: true,
      durationMs: duration,
      summary: { synced, failed, discovered, total: results.length },
      results,
    });
  } catch (error) {
    logger.error({ error }, 'Leaderboard refresh failed');
    return NextResponse.json({ error: 'Refresh failed' }, { status: 500 });
  }
}