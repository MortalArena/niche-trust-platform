import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { createGroupReview, canUserReviewGroup } from '@/lib/reviews/service';

const reviewSchema = z.object({
  rating: z.number().int().min(1).max(5),
  comment: z.string().max(2000).optional(),
});

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await context.params;

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    select: { avgRating: true, reviewCount: true },
  });

  if (!group) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const reviews = await prisma.groupReview.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      user: { select: { displayName: true, walletAddress: true, isAnonymous: true } },
    },
  });

  return NextResponse.json({
    avgRating: Number(group.avgRating),
    reviewCount: group.reviewCount,
    reviews: reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      author: r.user.isAnonymous
        ? 'Verified subscriber'
        : (r.user.displayName ?? `${r.user.walletAddress?.slice(0, 6)}...`),
    })),
  });
}

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await context.params;
  const body = await req.json();
  const parsed = reviewSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid review' }, { status: 400 });
  }

  const canReview = await canUserReviewGroup(session.user.id, groupId);
  if (!canReview) {
    return NextResponse.json(
      { error: 'Only paying subscribers can review this group' },
      { status: 403 }
    );
  }

  try {
    const review = await createGroupReview({
      userId: session.user.id,
      groupId,
      rating: parsed.data.rating,
      comment: parsed.data.comment,
    });
    return NextResponse.json({ review });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to submit review';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
