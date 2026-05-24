import { prisma } from '@/lib/db';
import { getActivityForUser, getPositionsForUser, getTradesForUser } from '@/lib/polymarket/data';
import { dataApiUserAddress, resolvePolymarketProfile } from '@/lib/polymarket/profiles';
import { calculateTrustScore } from '@/lib/analytics/trustscore';
import type { TradeRecord } from '@/lib/analytics/types';

export interface PolymarketSyncResult {
  walletQueried: string;
  proxyWallet: string;
  profileFound: boolean;
  tradeCount: number;
  openPositions: number;
  activityCount: number;
  trustScore?: number;
  note: string;
}

/**
 * Pull expert stats from Polymarket Data API (real PM trades — not generic Polygon scan).
 * Predictions on Niche Trust stay E2EE + Solana Memo; PM does not expose private predictions text.
 */
export async function syncExpertFromPolymarket(
  userId: string,
  eoaOrProxy: string
): Promise<PolymarketSyncResult> {
  const profile = await resolvePolymarketProfile(eoaOrProxy);
  const queryAddress = dataApiUserAddress(profile, eoaOrProxy);

  const [trades, positions, activity] = await Promise.all([
    getTradesForUser(queryAddress, 200),
    getPositionsForUser(queryAddress, 100),
    getActivityForUser(queryAddress, 50),
  ]);

  const tradeRecords: TradeRecord[] = trades.map((t) => {
    const notional = t.size * t.price;
    const pnlEstimate = t.side === 'SELL' ? notional * 0.02 : -notional * 0.01;
    const ts = t.timestamp > 1e12 ? Math.floor(t.timestamp / 1000) : t.timestamp;
    return {
      pnl: pnlEstimate,
      entryPrice: t.price,
      exitPrice: t.price,
      size: t.size,
      entryTime: ts,
      exitTime: ts,
    };
  });

  let trustScore: number | undefined;
  if (tradeRecords.length > 0) {
    const equityCurve = tradeRecords.reduce<number[]>((curve, t) => {
      const prev = curve.length ? curve[curve.length - 1]! : 0;
      curve.push(prev + t.pnl);
      return curve;
    }, []);

    const result = calculateTrustScore({
      trades: tradeRecords,
      monthlyReturns: [],
      equityCurve,
      tradeCount: tradeRecords.length,
      activityDays: new Set(trades.map((t) => new Date(t.timestamp * 1000).toDateString())).size,
    });

    trustScore = result.trustScore;

    await prisma.traderScore.upsert({
      where: { userId },
      update: {
        trustScore: result.trustScore,
        winRate: result.winRate,
        roi: result.roi,
        maxDrawdown: result.maxDrawdown,
        consistency: result.consistency,
        totalTrades: trades.length,
        chainBreakdown: {
          polymarket: {
            trustScore: result.trustScore,
            trades: trades.length,
            source: 'data-api.polymarket.com',
          },
        },
        lastCalculatedAt: new Date(),
      },
      create: {
        userId,
        trustScore: result.trustScore,
        winRate: result.winRate,
        roi: result.roi,
        maxDrawdown: result.maxDrawdown,
        consistency: result.consistency,
        totalTrades: trades.length,
        chainBreakdown: {
          polymarket: {
            trustScore: result.trustScore,
            trades: trades.length,
            source: 'data-api.polymarket.com',
          },
        },
      },
    });
  }

  if (profile?.name || profile?.pseudonym) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        displayName: profile.name ?? profile.pseudonym ?? undefined,
        bio: profile.bio ?? undefined,
      },
    });
  }

  return {
    walletQueried: eoaOrProxy,
    proxyWallet: queryAddress,
    profileFound: Boolean(profile),
    tradeCount: trades.length,
    openPositions: positions.length,
    activityCount: activity.length,
    trustScore,
    note:
      'Synced from Polymarket Data API (trades/positions). Niche Trust predictions are separate (encrypted, Solana hash only).',
  };
}
