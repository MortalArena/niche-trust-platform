import { prisma } from '@/lib/db';
import { getTradesForUser } from '@/lib/polymarket/data';
import { resolvePolymarketProfile } from '@/lib/polymarket/profiles';
import { calculateTrustScore } from '@/lib/analytics/trustscore';
import type { TradeRecord } from '@/lib/analytics/types';
import { logger } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────────

export interface PolymarketTraderBrief {
  proxyWallet: string;
  displayName: string | null;
  pseudonym: string | null;
  verifiedBadge: boolean | null;
  xUsername: string | null;
  trustScore: number;
  winRate: number;
  roi: number;
  maxDrawdown: number;
  consistency: number;
  profitFactor: number;
  riskLevel: string;
  totalTrades: number;
  activityDays: number;
  categories: string[];
  polymarketUrl: string | undefined;
}

export interface LeaderboardEntry {
  rank: number;
  trader: PolymarketTraderBrief;
}

const POLYMARKET_SITE = 'https://polymarket.com';

/**
 * Sync a single Polymarket trader by proxy wallet address.
 * Fetches all trades → computes TrustScore → stores/updates in DB.
 */
export async function syncPolymarketTrader(
  proxyWallet: string,
  categorySlug: string
): Promise<PolymarketTraderBrief | null> {
  try {
    const profile = await resolvePolymarketProfile(proxyWallet);
    const queryAddress = (profile?.proxyWallet ?? proxyWallet).toLowerCase();

    const trades = await getTradesForUser(queryAddress, 200);
    if (!trades.length) return null;

    const tradeRecords: TradeRecord[] = trades.map((t) => {
      const pnl = t.side === 'SELL' ? t.size * t.price * 0.02 : -t.size * t.price * 0.01;
      const ts = t.timestamp > 1e12 ? Math.floor(t.timestamp / 1000) : t.timestamp;
      return {
        pnl,
        entryPrice: t.price,
        exitPrice: t.price,
        size: t.size,
        entryTime: ts,
        exitTime: ts,
      };
    });

    const activityDays = new Set(trades.map((t) => new Date(t.timestamp * 1000).toDateString())).size;
    const equityCurve = tradeRecords.reduce<number[]>((curve, tr) => {
      const prev = curve.length ? curve[curve.length - 1]! : 0;
      curve.push(prev + tr.pnl);
      return curve;
    }, []);

    const result = calculateTrustScore({
      trades: tradeRecords,
      monthlyReturns: [],
      equityCurve,
      tradeCount: tradeRecords.length,
      activityDays,
    });

    const brief: PolymarketTraderBrief = {
      proxyWallet: queryAddress,
      displayName: profile?.name ?? null,
      pseudonym: profile?.pseudonym ?? null,
      verifiedBadge: profile?.verifiedBadge ?? null,
      xUsername: profile?.xUsername ?? null,
      trustScore: result.trustScore,
      winRate: result.winRate,
      roi: result.roi,
      maxDrawdown: result.maxDrawdown,
      consistency: result.consistency,
      profitFactor: result.profitFactor,
      riskLevel: result.riskLevel,
      totalTrades: tradeRecords.length,
      activityDays,
      categories: [categorySlug],
      polymarketUrl: queryAddress ? `${POLYMARKET_SITE}/profile/${queryAddress}` : undefined,
    };

    // Store/update in DB cache
    await prisma.polymarketTrader.upsert({
      where: { proxyWallet: queryAddress },
      update: {
        displayName: brief.displayName,
        pseudonym: brief.pseudonym,
        verifiedBadge: brief.verifiedBadge ?? false,
        xUsername: brief.xUsername,
        trustScore: brief.trustScore,
        winRate: brief.winRate,
        roi: brief.roi,
        maxDrawdown: brief.maxDrawdown,
        consistency: brief.consistency,
        profitFactor: brief.profitFactor,
        riskLevel: brief.riskLevel,
        totalTrades: brief.totalTrades,
        activityDays: brief.activityDays,
        categories: { push: [categorySlug] },
        lastSyncedAt: new Date(),
      },
      create: {
        proxyWallet: queryAddress,
        displayName: brief.displayName,
        pseudonym: brief.pseudonym,
        verifiedBadge: brief.verifiedBadge ?? false,
        xUsername: brief.xUsername,
        trustScore: brief.trustScore,
        winRate: brief.winRate,
        roi: brief.roi,
        maxDrawdown: brief.maxDrawdown,
        consistency: brief.consistency,
        profitFactor: brief.profitFactor,
        riskLevel: brief.riskLevel,
        totalTrades: brief.totalTrades,
        activityDays: brief.activityDays,
        categories: [categorySlug],
        lastSyncedAt: new Date(),
      },
    });

    return brief;
  } catch (error) {
    logger.error({ proxyWallet, error }, 'Failed to sync Polymarket trader');
    return null;
  }
}

/**
 * Get leaderboard from DB cache, sorted by trustScore descending.
 * Filters by category and minimum trade count.
 */
export async function getLeaderboard(options?: {
  categorySlug?: string;
  minTrades?: number;
  limit?: number;
}): Promise<LeaderboardEntry[]> {
  const { categorySlug, minTrades = 5, limit = 50 } = options ?? {};

  const where: Record<string, unknown> = {
    totalTrades: { gte: minTrades },
  };

  if (categorySlug) {
    where.categories = { has: categorySlug };
  }

  const traders = await prisma.polymarketTrader.findMany({
    where,
    orderBy: { trustScore: 'desc' },
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
      winRate: Number(t.winRate),
      roi: Number(t.roi),
      maxDrawdown: Number(t.maxDrawdown),
      consistency: Number(t.consistency),
      profitFactor: Number(t.profitFactor),
      riskLevel: t.riskLevel,
      totalTrades: t.totalTrades,
      activityDays: t.activityDays,
      categories: t.categories,
      polymarketUrl: t.proxyWallet ? `${POLYMARKET_SITE}/profile/${t.proxyWallet}` : undefined,
    },
  }));
}