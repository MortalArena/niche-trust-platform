import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: admin.error === 'unauthorized' ? 401 : 403 });
  }

  const [
    users,
    groups,
    subscriptions,
    revenue,
    pendingExpert,
    reviews,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.group.count(),
    prisma.subscription.count({ where: { status: 'active' } }),
    prisma.subscription.aggregate({ _sum: { platformFeeUsd: true, amountUsd: true } }),
    prisma.subscription.aggregate({
      where: { expertPayoutStatus: 'pending' },
      _sum: { expertNetUsd: true },
    }),
    prisma.groupReview.count(),
  ]);

  return NextResponse.json({
    users,
    groups,
    activeSubscriptions: subscriptions,
    totalVolumeUsd: Number(revenue._sum.amountUsd ?? 0),
    platformRevenueUsd: Number(revenue._sum.platformFeeUsd ?? 0),
    pendingExpertPayoutsUsd: Number(pendingExpert._sum.expertNetUsd ?? 0),
    reviews,
  });
}
