import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;

  const [
    user,
    score,
    wallets,
    activeSubs,
    ownedGroups,
    predictions,
    reviewsGiven,
    recentActivityLog,
    expertPayouts,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        walletAddress: true,
        expertBalanceUsd: true,
        displayName: true,
        isAnonymous: true,
      },
    }),
    prisma.traderScore.findUnique({ where: { userId } }),
    prisma.wallet.findMany({
      where: { userId },
      select: { id: true, address: true, chain: true, isPrimary: true, lastSyncedAt: true },
    }),
    prisma.subscription.findMany({
      where: { userId, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] },
      include: { group: { select: { id: true, name: true } } },
    }),
    prisma.group.findMany({
      where: { ownerId: userId },
      select: { id: true, name: true, subscriberCount: true, monthlyPriceUsd: true, isPublic: true },
    }),
    prisma.prediction.findMany({
      where: { authorId: userId },
      select: { id: true, outcome: true, createdAt: true },
    }),
    prisma.groupReview.count({ where: { userId } }),
    prisma.adminAuditLog.findMany({
      where: { adminId: userId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
    prisma.expertPayout.findMany({
      where: { expertId: userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
  ]);

  // Wallet address
  const walletAddress = user?.walletAddress ?? wallets[0]?.address ?? null;

  // Score data
  const chainBreakdown = score?.chainBreakdown as Record<string, { trustScore: number; trades: number }> | null;

  // Active subscriptions count
  const activeSubscriptions = activeSubs.length;

  // Total spent
  const totalSpentUsd = Number(
    (
      await prisma.subscription.aggregate({
        where: { userId, status: { in: ['active', 'expired'] } },
        _sum: { amountUsd: true },
      })
    )._sum.amountUsd ?? 0
  );

  // Total subscribers across owned groups
  const totalSubscribers = ownedGroups.reduce((sum, g) => sum + g.subscriberCount, 0);

  // Active groups count
  const activeGroups = ownedGroups.filter((g) => g.isPublic).length;

  // Prediction results
  const predictionResults = {
    win: predictions.filter((p) => p.outcome === 'WIN').length,
    loss: predictions.filter((p) => p.outcome === 'LOSS').length,
    pending: predictions.filter((p) => p.outcome === 'PENDING' || !p.outcome).length,
  };

  // Earnings
  const monthlyEarnings = Number(
    (
      await prisma.subscription.aggregate({
        where: {
          group: { ownerId: userId },
          status: 'active',
          createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
        },
        _sum: { expertNetUsd: true },
      })
    )._sum.expertNetUsd ?? 0
  );

  const lastPayout = expertPayouts[0];
  const lastPayoutUsd = Number(lastPayout?.amountUsd ?? 0);
  const pendingPayoutUsd = Number(user?.expertBalanceUsd ?? 0);

  // Favorite experts (subscribed experts)
  const favoriteExperts = (
    await Promise.all(
      activeSubs.map(async (sub) => {
        // Fetch group with owner info
        const groupWithOwner = await prisma.group.findUnique({
          where: { id: sub.group.id },
          select: { owner: { select: { id: true, displayName: true, walletAddress: true, scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' }, select: { trustScore: true } } } } },
        });
        const expert = groupWithOwner?.owner;
        if (!expert) return null;
        return {
          id: expert.id,
          name: expert.displayName ?? expert.walletAddress?.slice(0, 8) ?? 'Expert',
          trustScore: Number(expert.scores[0]?.trustScore ?? 0),
        };
      })
    )
  ).filter(Boolean) as { id: string; name: string; trustScore: number }[];

  // Recent activity (combine subscriptions + predictions + payouts)
  const recentActivity: { id: string; type: string; text: string; time: Date }[] = [];

  // Subscriptions as activity
  for (const sub of activeSubs) {
    recentActivity.push({
      id: `sub-${sub.id}`,
      type: 'subscription',
      text: `Subscribed to "${sub.group.name}" — $${Number(sub.amountUsd).toFixed(2)}`,
      time: sub.createdAt,
    });
  }

  // Predictions as activity
  for (const pred of predictions.slice(0, 10)) {
    recentActivity.push({
      id: `pred-${pred.id}`,
      type: 'prediction',
      text: `Prediction ${pred.outcome === 'PENDING' ? 'published' : pred.outcome === 'WIN' ? 'won 🎯' : 'lost'}`,
      time: pred.createdAt,
    });
  }

  // Payouts as activity
  for (const payout of expertPayouts.slice(0, 5)) {
    recentActivity.push({
      id: `payout-${payout.id}`,
      type: 'payment',
      text: `Payout $${Number(payout.amountUsd).toFixed(2)} — ${payout.status}`,
      time: payout.createdAt,
    });
  }

  // Sort by time descending
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  return NextResponse.json({
    trustScore: score ? Number(score.trustScore) : null,
    roi: score ? Number(score.roi) : null,
    winRate: score ? Number(score.winRate) : null,
    maxDrawdown: score ? Number(score.maxDrawdown) : null,
    profitFactor: score ? Number(score.profitFactor) : null,
    consistency: score ? Number(score.consistency) : null,
    riskLevel: score?.riskLevel ?? 'MEDIUM',
    totalTrades: score?.totalTrades ?? 0,
    walletAddress,
    expertBalanceUsd: Number(user?.expertBalanceUsd ?? 0),

    // Customer
    activeSubscriptions,
    totalSpentUsd,
    reviewsGiven,
    favoriteExperts,

    // Expert
    totalSubscribers,
    activeGroups,
    totalPredictions: predictions.length,
    predictionResults,
    monthlyEarnings,
    lastPayoutUsd,
    pendingPayoutUsd,

    // Activity
    recentActivity,
  });
}