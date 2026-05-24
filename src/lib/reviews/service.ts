import { prisma } from '@/lib/db';
export async function canUserReviewGroup(userId: string, groupId: string): Promise<boolean> {
  const paid = await prisma.subscription.findFirst({
    where: {
      userId,
      groupId,
      status: { in: ['active', 'expired'] },
    },
  });
  return Boolean(paid);
}

export async function createGroupReview(params: {
  userId: string;
  groupId: string;
  rating: number;
  comment?: string;
}) {
  if (params.rating < 1 || params.rating > 5) {
    throw new Error('Rating must be between 1 and 5');
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: params.userId,
      groupId: params.groupId,
      status: { in: ['active', 'expired'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!subscription) {
    throw new Error('Only verified paying subscribers can leave a review');
  }

  const existing = await prisma.groupReview.findUnique({
    where: { userId_groupId: { userId: params.userId, groupId: params.groupId } },
  });

  if (existing) {
    throw new Error('You already reviewed this group');
  }

  const review = await prisma.groupReview.create({
    data: {
      userId: params.userId,
      groupId: params.groupId,
      subscriptionId: subscription.id,
      rating: params.rating,
      comment: params.comment?.trim() || null,
    },
  });

  await refreshGroupRatingStats(params.groupId);
  return review;
}

export async function refreshGroupRatingStats(groupId: string) {
  const agg = await prisma.groupReview.aggregate({
    where: { groupId },
    _avg: { rating: true },
    _count: { id: true },
  });

  await prisma.group.update({
    where: { id: groupId },
    data: {
      avgRating: agg._avg.rating ?? 0,
      reviewCount: agg._count.id,
    },
  });
}

export async function getExpertServiceRating(ownerId: string) {
  const groups = await prisma.group.findMany({
    where: { ownerId },
    select: { avgRating: true, reviewCount: true },
  });

  if (groups.length === 0) {
    return { avgRating: 0, reviewCount: 0 };
  }

  const totalReviews = groups.reduce((s, g) => s + g.reviewCount, 0);
  if (totalReviews === 0) return { avgRating: 0, reviewCount: 0 };

  const weighted = groups.reduce(
    (s, g) => s + Number(g.avgRating) * g.reviewCount,
    0
  );

  return {
    avgRating: weighted / totalReviews,
    reviewCount: totalReviews,
  };
}

export async function assertSubscriberForReview(userId: string, groupId: string) {
  const ok = await canUserReviewGroup(userId, groupId);
  if (!ok) throw new Error('Active or past paid subscription required');
}
