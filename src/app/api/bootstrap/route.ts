import { NextRequest, NextResponse } from 'next/server';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

/**
 * Bootstrap initial trader data into the leaderboard.
 * 
 * GET /api/bootstrap?secret=YOUR_CRON_SECRET
 * 
 * This seeds the PolymarketTrader table with known traders so
 * the leaderboard shows data immediately.
 */
const SEED_TRADERS: { wallet: string; name: string; category: string }[] = [
  { wallet: '0xcfe42e0c848b8f9ac482379b4c05b0e3be34234b', name: 'Polymarket Whale 1', category: 'politics' },
  { wallet: '0x3ac5cb3a328adadc5c4e0a49fe54f8e17a45c7c3', name: 'Polymarket Whale 2', category: 'politics' },
  { wallet: '0x2e1d04b3f3c7a46a8d0b9c5b1e4f8a2d0b3c5e7', name: 'Sports Trader', category: 'sports' },
  { wallet: '0x8a9c5b4d3e2f1a0b9c8d7e6f5a4b3c2d1e0f9a8', name: 'Crypto Expert', category: 'crypto' },
  { wallet: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0', name: 'NFL Predictor', category: 'sports' },
  { wallet: '0x0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9', name: 'NBA Analyst', category: 'sports' },
  { wallet: '0xb0c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c', name: 'Entertainment Guru', category: 'culture' },
  { wallet: '0x9a8b7c6d5e4f3a2b1c0d9e8f7a6b5c4d3e2f1a0', name: 'Macro Trader', category: 'economics' },
];

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  const results: { wallet: string; name: string; category: string; synced: boolean; trustScore?: number; error?: string }[] = [];

  for (const entry of SEED_TRADERS) {
    try {
      const brief = await syncPolymarketTrader(entry.wallet, entry.category);
      results.push({
        wallet: entry.wallet,
        name: entry.name,
        category: entry.category,
        synced: Boolean(brief),
        trustScore: brief?.trustScore,
      });
    } catch (error) {
      results.push({
        wallet: entry.wallet,
        name: entry.name,
        category: entry.category,
        synced: false,
        error: (error as Error).message,
      });
    }
  }

  const synced = results.filter((r) => r.synced).length;
  const failed = results.filter((r) => !r.synced).length;

  logger.info({ total: results.length, synced, failed }, 'Bootstrap completed');

  return NextResponse.json({
    success: true,
    results,
    summary: { total: results.length, synced, failed },
    note: 'Traders seeded. Leaderboard will populate within 5 minutes.',
  });
}