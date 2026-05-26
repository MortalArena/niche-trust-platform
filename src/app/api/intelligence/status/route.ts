import { NextResponse } from 'next/server';
import { getIntelligenceStats } from '@/lib/polymarket/leaderboard';

export const dynamic = 'force-dynamic';

/** GET /api/intelligence/status — pipeline health for ops & UI */
export async function GET() {
  try {
    const stats = await getIntelligenceStats();
    return NextResponse.json({
      ok: true,
      engine: 'niche-trust-intelligence',
      refreshIntervalMinutes: 5,
      ...stats,
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
