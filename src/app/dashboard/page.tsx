import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { PageShell } from '@/components/ui/page-shell';
import { DashboardFull } from '@/components/dashboard-full';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connect');

  const userId = session.user.id;

  // Fetch all data directly from Prisma (no fetch loop needed)
  const [user, score, activeSubs, ownedGroups, predictions, expertPayouts] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { walletAddress: true, expertBalanceUsd: true, role: true } }),
    prisma.traderScore.findUnique({ where: { userId } }),
    prisma.subscription.findMany({ where: { userId, status: 'active', OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }, include: { group: { select: { id: true, name: true } } } }),
    prisma.group.findMany({ where: { ownerId: userId }, select: { id: true, name: true, subscriberCount: true, isPublic: true } }),
    prisma.prediction.findMany({ where: { authorId: userId }, select: { id: true, outcome: true, createdAt: true } }),
    prisma.expertPayout.findMany({ where: { expertId: userId }, orderBy: { createdAt: 'desc' }, take: 10 }),
  ]);

  // Favorite experts
  const favExperts = (
    await Promise.all(
      activeSubs.map(async (sub) => {
        const g = await prisma.group.findUnique({ where: { id: sub.group.id }, select: { owner: { select: { id: true, displayName: true, walletAddress: true, scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' }, select: { trustScore: true } } } } } });
        const e = g?.owner;
        if (!e) return null;
        return { id: e.id, name: e.displayName ?? e.walletAddress?.slice(0, 8) ?? 'Expert', trustScore: Number(e.scores[0]?.trustScore ?? 0) };
      })
    )
  ).filter(Boolean) as { id: string; name: string; trustScore: number }[];

  // Total spent
  const totalSpentAgg = await prisma.subscription.aggregate({ where: { userId, status: { in: ['active', 'expired'] } }, _sum: { amountUsd: true } });

  // Monthly earnings
  const monthlyAgg = await prisma.subscription.aggregate({ where: { group: { ownerId: userId }, status: 'active', createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }, _sum: { expertNetUsd: true } });

  // Recent activity
  const recentActivity: { id: string; type: string; text: string; time: Date }[] = [];
  for (const sub of activeSubs) recentActivity.push({ id: `sub-${sub.id}`, type: 'subscription', text: `Subscribed to "${sub.group.name}"`, time: sub.createdAt });
  for (const pred of predictions.slice(0, 10)) recentActivity.push({ id: `pred-${pred.id}`, type: 'prediction', text: `Prediction ${pred.outcome === 'WIN' ? 'won 🎯' : pred.outcome === 'LOSS' ? 'lost' : 'published'}`, time: pred.createdAt });
  for (const p of expertPayouts.slice(0, 5)) recentActivity.push({ id: `payout-${p.id}`, type: 'payment', text: `Payout $${Number(p.amountUsd).toFixed(2)} — ${p.status}`, time: p.createdAt });
  recentActivity.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

  const initial = {
    trustScore: score ? Number(score.trustScore) : null,
    roi: score ? Number(score.roi) : null,
    winRate: score ? Number(score.winRate) : null,
    maxDrawdown: score ? Number(score.maxDrawdown) : null,
    profitFactor: score ? Number(score.profitFactor) : null,
    consistency: score ? Number(score.consistency) : null,
    riskLevel: score?.riskLevel ?? 'MEDIUM',
    totalTrades: score?.totalTrades ?? 0,
    walletAddress: user?.walletAddress ?? (session.user as { walletAddress?: string }).walletAddress ?? null,
    expertBalanceUsd: Number(user?.expertBalanceUsd ?? 0),
    activeSubscriptions: activeSubs.length,
    totalSpentUsd: Number(totalSpentAgg._sum.amountUsd ?? 0),
    reviewsGiven: await prisma.groupReview.count({ where: { userId } }),
    favoriteExperts: favExperts,
    totalSubscribers: ownedGroups.reduce((s, g) => s + g.subscriberCount, 0),
    activeGroups: ownedGroups.filter((g) => g.isPublic).length,
    totalPredictions: predictions.length,
    predictionResults: { win: predictions.filter((p) => p.outcome === 'WIN').length, loss: predictions.filter((p) => p.outcome === 'LOSS').length, pending: predictions.filter((p) => p.outcome === 'PENDING' || !p.outcome).length },
    monthlyEarnings: Number(monthlyAgg._sum.expertNetUsd ?? 0),
    lastPayoutUsd: Number(expertPayouts[0]?.amountUsd ?? 0),
    pendingPayoutUsd: Number(user?.expertBalanceUsd ?? 0),
    recentActivity,
  };

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Full toolkit for buyers & sellers — trust scores, earnings, predictions, and more.
        </p>
        <DashboardFull initial={initial} userId={userId} userRole={user?.role ?? 'user'} />
      </div>
    </PageShell>
  );
}
