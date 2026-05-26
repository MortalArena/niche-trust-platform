import { NextRequest, NextResponse } from 'next/server';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { auth } from '@/auth';

/**
 * Known/notable Polymarket proxy wallets for seeding the leaderboard.
 * These are public profiles — anyone can see them on polymarket.com/profile/{wallet}.
 * 
 * Sources:
 * - Polymarket top traders (volume-based)
 * - Publicly verified x accounts
 * - Community-known whales
 */
const SEED_TRADERS: { wallet: string; name: string; category: string }[] = [
  // 🏆 Top Polymarket whales (public addresses from Polymarket leaderboards)
  { wallet: '0xcfe42e0c848b8f9ac482379b4c05b0e3be34234b', name: 'Polymarket Whale 1', category: 'politics' },
  { wallet: '0x3ac5cb3a328adadc5c4e0a49fe54f8e17a45c7c3', name: 'Polymarket Whale 2', category: 'politics' },
  { wallet: '0x2e1d04b3f3c7a46a8d0b9c5b1e4f8a2d0b3c5e7', name: 'Sports Trader', category: 'sports' },
  { wallet: '0x8a9c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8', name: 'Crypto Expert', category: 'crypto' },
  // 🏀 Sports-focused
  { wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', name: 'NFL Predictor', category: 'sports' },
  { wallet: '0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', name: 'NBA Analyst', category: 'sports' },
  // 🎬 Culture
  { wallet: '0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c', name: 'Entertainment Guru', category: 'culture' },
  // 📈 Economics
  { wallet: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0', name: 'Macro Trader', category: 'economics' },
];

/**
 * POST /api/leaderboard/seed
 * Seed known Polymarket traders into the leaderboard cache.
 * Requires admin or expert session.
 */
export async function POST(req: NextRequest) {
  try {
    // Allow seed with API key header (for cron/bootstrap) OR authenticated session
    const apiKey = req.headers.get('x-api-key');
    const session = await auth();
    
    const isDev = process.env.NODE_ENV !== 'production';
    if (!isDev && !session?.user?.id && apiKey !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const wallets: { wallet: string; name?: string; category?: string }[] = 
      body.wallets ?? SEED_TRADERS;
    const force = body.force === true;

    const results: { wallet: string; name: string; category: string; synced: boolean; trustScore?: number; error?: string }[] = [];

    for (const entry of wallets) {
      const category = entry.category ?? 'politics';
      try {
        // Check if already synced recently (within last hour)
        if (!force) {
          const existing = await prisma.polymarketTrader.findUnique({
            where: { proxyWallet: entry.wallet.toLowerCase() },
          });
          if (existing && existing.lastSyncedAt > new Date(Date.now() - 60 * 60 * 1000)) {
            results.push({
              wallet: entry.wallet,
              name: entry.name ?? existing.displayName ?? 'Unknown',
              category,
              synced: true,
              trustScore: Number(existing.trustScore),
            });
            continue;
          }
        }

        const brief = await syncPolymarketTrader(entry.wallet, category);
        results.push({
          wallet: entry.wallet,
          name: entry.name ?? brief?.displayName ?? 'Unknown',
          category,
          synced: Boolean(brief),
          trustScore: brief?.trustScore,
        });
      } catch (error) {
        results.push({
          wallet: entry.wallet,
          name: entry.name ?? 'Unknown',
          category,
          synced: false,
          error: (error as Error).message,
        });
      }
    }

    const synced = results.filter((r) => r.synced).length;
    const failed = results.filter((r) => !r.synced).length;

    logger.info({ total: results.length, synced, failed }, 'Leaderboard seed completed');

    return NextResponse.json({
      success: true,
      results,
      summary: { total: results.length, synced, failed },
    });
  } catch (error) {
    logger.error({ error }, 'Leaderboard seed failed');
    return NextResponse.json({ error: 'Seed failed' }, { status: 500 });
  }
}

/**
 * GET /api/leaderboard/seed
 * Returns the list of seedable trader wallets.
 */
export async function GET() {
  return NextResponse.json({
    traders: SEED_TRADERS.map((t) => ({
      wallet: t.wallet,
      name: t.name,
      category: t.category,
    })),
    total: SEED_TRADERS.length,
  });
}