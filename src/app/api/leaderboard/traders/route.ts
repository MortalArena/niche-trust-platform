import { NextRequest, NextResponse } from 'next/server';
import { getLeaderboard } from '@/lib/polymarket/leaderboard';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';

/**
 * GET /api/leaderboard/traders
 * Returns Polymarket leaderboard sorted by trustScore descending.
 *
 * Query params:
 *   category  - Filter by category slug (e.g. "sports", "politics", "crypto")
 *   minTrades - Minimum trades required (default: 5)
 *   limit     - Max results (default: 50)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const categorySlug = searchParams.get('category') ?? undefined;
    const minTrades = Number(searchParams.get('minTrades')) || 5;
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 200);

    // Validate category if provided
    if (categorySlug) {
      const validSlugs = MARKET_CATEGORIES.map((c) => c.slug);
      if (!validSlugs.includes(categorySlug)) {
        return NextResponse.json(
          { error: `Invalid category "${categorySlug}". Valid: ${validSlugs.join(', ')}` },
          { status: 400 }
        );
      }
    }

    const sortBy = (searchParams.get('sortBy') ?? 'edgeScore') as
      | 'edgeScore'
      | 'trustScore'
      | 'roi'
      | 'winRate'
      | 'totalVolumeUsd';

    const leaderboard = await getLeaderboard({
      categorySlug,
      minTrades,
      limit,
      sortBy,
    });

    return NextResponse.json({
      success: true,
      category: categorySlug ?? 'all',
      total: leaderboard.length,
      traders: leaderboard,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Leaderboard API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}