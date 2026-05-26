import { prisma } from '@/lib/db';
import { getTradesForUser, getClosedPositionsForUser } from '@/lib/polymarket/data';
import { resolvePolymarketProfile } from '@/lib/polymarket/profiles';
import { calculateTrustScore } from '@/lib/analytics/trustscore';
import { calculateEdgeScore } from '@/lib/intelligence/edge-score';
import { tradesFromPolymarket } from '@/lib/polymarket/trade-metrics';
import { buildMonthlyReturns } from '@/lib/analytics/trades-from-txs';
import { logger } from '@/lib/logger';

export interface PolymarketTraderBrief {
  proxyWallet: string;
  displayName: string | null;
  pseudonym: string | null;
  verifiedBadge: boolean | null;
  xUsername: string | null;
  trustScore: number;
  edgeScore: number;
  winRate: number;
  roi: number;
  maxDrawdown: number;
  consistency: number;
  profitFactor: number;
  riskLevel: string;
  totalTrades: number;
  activityDays: number;
  avgTradeSize: number;
  totalVolumeUsd: number;
  timingScore: number;
  categories: string[];
  polymarketUrl: string | undefined;
}

export interface LeaderboardEntry {
  rank: number;
  trader: PolymarketTraderBrief;
}

const POLYMARKET_SITE = 'https://polymarket.com';

function mergeCategories(existing: string[], next: string): string[] {
  return [...new Set([...existing, next])];
}

/**
 * Sync a single Polymarket wallet: incremental fetch → Edge Score → DB cache.
 */
export async function syncPolymarketTrader(
  proxyWallet: string,
  categorySlug: string
): Promise<PolymarketTraderBrief | null> {
  try {
    const profile = await resolvePolymarketProfile(proxyWallet);
    const queryAddress = (profile?.proxyWallet ?? proxyWallet).toLowerCase();

    const [trades, closed] = await Promise.all([
      getTradesForUser(queryAddress, 300),
      getClosedPositionsForUser(queryAddress, 100).catch(() => []),
    ]);

    if (!trades.length && !closed.length) return null;

    const { tradeRecords, totalVolumeUsd, avgTradeSize, timingScore } = tradesFromPolymarket(
      trades,
      closed
    );

    const activityDays = new Set(
      trades.map((t) => new Date(t.timestamp * 1000).toDateString())
    ).size;

    const equityCurve = tradeRecords.reduce<number[]>((curve, tr) => {
      const prev = curve.length ? curve[curve.length - 1]! : 0;
      curve.push(prev + tr.pnl);
      return curve;
    }, []);

    const monthlyReturns = buildMonthlyReturns(tradeRecords);
    const tradesPerMonth = tradeRecords.length / Math.max(1, activityDays / 30);

    const result = calculateTrustScore({
      trades: tradeRecords,
      monthlyReturns,
      equityCurve,
      tradeCount: tradeRecords.length,
      activityDays: Math.max(activityDays, 1),
    });

    const edgeScore = calculateEdgeScore({
      roi: result.roi,
      consistency: result.consistency,
      maxDrawdown: result.maxDrawdown,
      timingScore,
      tradesPerMonth,
    });

    const existing = await prisma.polymarketTrader.findUnique({
      where: { proxyWallet: queryAddress },
      select: { categories: true },
    });

    const categories = mergeCategories(existing?.categories ?? [], categorySlug);

    const brief: PolymarketTraderBrief = {
      proxyWallet: queryAddress,
      displayName: profile?.name ?? null,
      pseudonym: profile?.pseudonym ?? null,
      verifiedBadge: profile?.verifiedBadge ?? null,
      xUsername: profile?.xUsername ?? null,
      trustScore: result.trustScore,
      edgeScore,
      winRate: result.winRate,
      roi: result.roi,
      maxDrawdown: result.maxDrawdown,
      consistency: result.consistency,
      profitFactor: result.profitFactor,
      riskLevel: result.riskLevel,
      totalTrades: tradeRecords.length,
      activityDays,
      avgTradeSize,
      totalVolumeUsd,
      timingScore,
      categories,
      polymarketUrl: `${POLYMARKET_SITE}/profile/${queryAddress}`,
    };

    await prisma.polymarketTrader.upsert({
      where: { proxyWallet: queryAddress },
      update: {
        displayName: brief.displayName,
        pseudonym: brief.pseudonym,
        verifiedBadge: brief.verifiedBadge ?? false,
        xUsername: brief.xUsername,
        trustScore: brief.trustScore,
        edgeScore: brief.edgeScore,
        winRate: brief.winRate,
        roi: brief.roi,
        maxDrawdown: brief.maxDrawdown,
        consistency: brief.consistency,
        profitFactor: brief.profitFactor,
        riskLevel: brief.riskLevel,
        totalTrades: brief.totalTrades,
        activityDays: brief.activityDays,
        avgTradeSize: brief.avgTradeSize,
        totalVolumeUsd: brief.totalVolumeUsd,
        timingScore: brief.timingScore,
        categories,
        lastSyncedAt: new Date(),
      },
      create: {
        proxyWallet: queryAddress,
        displayName: brief.displayName,
        pseudonym: brief.pseudonym,
        verifiedBadge: brief.verifiedBadge ?? false,
        xUsername: brief.xUsername,
        trustScore: brief.trustScore,
        edgeScore: brief.edgeScore,
        winRate: brief.winRate,
        roi: brief.roi,
        maxDrawdown: brief.maxDrawdown,
        consistency: brief.consistency,
        profitFactor: brief.profitFactor,
        riskLevel: brief.riskLevel,
        totalTrades: brief.totalTrades,
        activityDays: brief.activityDays,
        avgTradeSize: brief.avgTradeSize,
        totalVolumeUsd: brief.totalVolumeUsd,
        timingScore: brief.timingScore,
        categories,
        lastSyncedAt: new Date(),
      },
    });

    return brief;
  } catch (error) {
    logger.error({ proxyWallet, error }, 'Failed to sync Polymarket trader');
    return null;
  }
}

export async function getLeaderboard(options?: {
  categorySlug?: string;
  minTrades?: number;
  limit?: number;
  sortBy?: 'edgeScore' | 'trustScore' | 'roi' | 'winRate' | 'totalVolumeUsd';
}): Promise<LeaderboardEntry[]> {
  const { categorySlug, minTrades = 5, limit = 50, sortBy = 'edgeScore' } = options ?? {};

  const where: Record<string, unknown> = {
    totalTrades: { gte: minTrades },
  };

  if (categorySlug) {
    where.categories = { has: categorySlug };
  }

  const orderBy = { [sortBy]: 'desc' as const };

  const traders = await prisma.polymarketTrader.findMany({
    where,
    orderBy,
    take: limit,
  });

  return traders.map((t, i) => ({
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
      polymarketUrl: t.proxyWallet ? `${POLYMARKET_SITE}/profile/${t.proxyWallet}` : undefined,
    },
  }));
}

export async function getIntelligenceStats() {
  const [traderCount, lastSync, rankings] = await Promise.all([
    prisma.polymarketTrader.count(),
    prisma.polymarketTrader.findFirst({
      orderBy: { lastSyncedAt: 'desc' },
      select: { lastSyncedAt: true },
    }),
    prisma.intelligenceRanking.findMany({
      select: { board: true, traderCount: true, computedAt: true },
    }),
  ]);

  return {
    traderCount,
    lastSyncedAt: lastSync?.lastSyncedAt?.toISOString() ?? null,
    rankings: rankings.map((r) => ({
      board: r.board,
      count: r.traderCount,
      computedAt: r.computedAt.toISOString(),
    })),
  };
}
