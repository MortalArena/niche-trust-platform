import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { userHasActiveSubscription } from '@/lib/groups/service';
import { getMatrixRoomUrl, isMatrixConfigured } from '@/lib/matrix/client';

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const session = await auth();

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
          scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' } },
        },
      },
      _count: { select: { members: true, subscriptions: true } },
    },
  });

  if (!group) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const isOwner = session?.user?.id === group.ownerId;
  const hasAccess =
    isOwner ||
    (session?.user?.id
      ? await userHasActiveSubscription(session.user.id, group.id)
      : false);

  return NextResponse.json({
    group: {
      id: group.id,
      name: group.name,
      description: group.description,
      monthlyPriceUsd: Number(group.monthlyPriceUsd),
      yearlyPriceUsd: group.yearlyPriceUsd ? Number(group.yearlyPriceUsd) : null,
      lifetimePriceUsd: group.lifetimePriceUsd ? Number(group.lifetimePriceUsd) : null,
      subscriberCount: group.subscriberCount,
      isPublic: group.isPublic,
      owner: group.owner,
      memberCount: group._count.members,
    },
    access: {
      isOwner,
      hasAccess,
      matrixRoomId: hasAccess ? group.matrixRoomId : null,
      matrixChatUrl:
        hasAccess && group.matrixRoomId && isMatrixConfigured()
          ? getMatrixRoomUrl(group.matrixRoomId)
          : null,
    },
  });
}
