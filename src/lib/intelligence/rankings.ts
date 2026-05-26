import type { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import type { LeaderboardEntry } from '@/lib/polymarket/leaderboard';
import type { RankingBoardId } from './edge-score';

function asJsonPayload(entries: LeaderboardEntry[]): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(entries)) as Prisma.InputJsonValue;
}

async function topTraders(where: Record<string, unknown>, orderBy: Record<string, 'desc'>, limit: number) {
  const rows = await prisma.polymarketTrader.findMany({
    where: { totalTrades: { gte: 5 }, ...where },
    orderBy,
    take: limit,
  });

  return rows.map((t, i) => ({
    rank: i + 1,
    trader: {
      proxyWallet: t.proxyWallet,
      displayName: t.displayName,
      pseudonym: t.pseudonym,
      verifiedBadge: t.verifiedBadge,
      xUsername: t.xUsername,
      trustScore: Number(t.trustScore),
      edgeScore: Number(t.edgeScore),
      winRate: Number(t.winRate),
      roi: Number(t.roi),
      maxDrawdown: Number(t.maxDrawdown),
      consistency: Number(t.consistency),
      profitFactor: Number(t.profitFactor),
      riskLevel: t.riskLevel,
      totalTrades: t.totalTrades,
      activityDays: t.activityDays,
      avgTradeSize: Number(t.avgTradeSize),
      totalVolumeUsd: Number(t.totalVolumeUsd),
      timingScore: Number(t.timingScore),
      categories: t.categories,
      polymarketUrl: `https://polymarket.com/profile/${t.proxyWallet}`,
    },
  }));
}

/** Recompute all ranking boards and store in IntelligenceRanking */
export async function refreshPrecomputedRankings(): Promise<Record<string, number>> {
  const boards: { board: RankingBoardId; categorySlug: string | null; fetch: () => Promise<LeaderboardEntry[]> }[] = [
    {
      board: 'top_edge',
      categorySlug: null,
      fetch: () => topTraders({}, { edgeScore: 'desc' }, 100),
    },
    {
      board: 'highest_roi_30d',
      categorySlug: null,
      fetch: () => topTraders({}, { roi: 'desc' }, 100),
    },
    {
      board: 'best_win_rate',
      categorySlug: null,
      fetch: () => topTraders({ totalTrades: { gte: 20 } }, { winRate: 'desc' }, 100),
    },
    {
      board: 'most_consistent',
      categorySlug: null,
      fetch: () => topTraders({}, { consistency: 'desc' }, 100),
    },
    {
      board: 'smart_money_volume',
      categorySlug: null,
      fetch: () => topTraders({}, { totalVolumeUsd: 'desc' }, 100),
    },
  ];

  const counts: Record<string, number> = {};

  for (const { board, categorySlug, fetch } of boards) {
    const entries = await fetch();
    await prisma.intelligenceRanking.upsert({
      where: {
        board_categorySlug: { board, categorySlug: categorySlug ?? '' },
      },
      update: {
        payload: asJsonPayload(entries),
        traderCount: entries.length,
        computedAt: new Date(),
      },
      create: {
        board,
        categorySlug: categorySlug ?? '',
        payload: asJsonPayload(entries),
        traderCount: entries.length,
      },
    });
    counts[board] = entries.length;
  }

  return counts;
}

export async function getPrecomputedRanking(
  board: string,
  categorySlug?: string
): Promise<{ entries: LeaderboardEntry[]; computedAt: string | null }> {
  const row = await prisma.intelligenceRanking.findUnique({
    where: {
      board_categorySlug: { board, categorySlug: categorySlug ?? '' },
    },
  });

  if (!row) return { entries: [], computedAt: null };
  return {
    entries: row.payload as unknown as LeaderboardEntry[],
    computedAt: row.computedAt.toISOString(),
  };
}
