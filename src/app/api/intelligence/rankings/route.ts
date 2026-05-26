import { NextRequest, NextResponse } from 'next/server';
import { RANKING_BOARDS, type RankingBoardId } from '@/lib/intelligence/edge-score';
import { getPrecomputedRanking } from '@/lib/intelligence/rankings';
import { getLeaderboard } from '@/lib/polymarket/leaderboard';

/**
 * GET /api/intelligence/rankings?board=top_edge
 * Returns precomputed ranking board when available; falls back to live DB query.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const board = (searchParams.get('board') ?? 'top_edge') as RankingBoardId;
    const categorySlug = searchParams.get('category') ?? undefined;
    const limit = Math.min(Number(searchParams.get('limit')) || 100, 200);

    if (!RANKING_BOARDS.includes(board)) {
      return NextResponse.json(
        { error: `Invalid board. Valid: ${RANKING_BOARDS.join(', ')}` },
        { status: 400 }
      );
    }

    const cached = await getPrecomputedRanking(board, categorySlug);
    if (cached.entries.length > 0) {
      return NextResponse.json({
        success: true,
        board,
        category: categorySlug ?? 'all',
        source: 'precomputed',
        total: Math.min(cached.entries.length, limit),
        traders: cached.entries.slice(0, limit),
        updatedAt: cached.computedAt,
      });
    }

    const sortMap: Record<
      RankingBoardId,
      'edgeScore' | 'roi' | 'winRate' | 'consistency' | 'totalVolumeUsd'
    > = {
      top_edge: 'edgeScore',
      highest_roi_30d: 'roi',
      best_win_rate: 'winRate',
      most_consistent: 'consistency',
      smart_money_volume: 'totalVolumeUsd',
    };

    const minTrades = board === 'best_win_rate' ? 20 : 5;
    const traders = await getLeaderboard({
      categorySlug,
      minTrades,
      limit,
      sortBy: sortMap[board],
    });

    return NextResponse.json({
      success: true,
      board,
      category: categorySlug ?? 'all',
      source: 'live',
      total: traders.length,
      traders,
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Intelligence rankings API error:', error);
    return NextResponse.json({ error: 'Failed to fetch rankings' }, { status: 500 });
  }
}
