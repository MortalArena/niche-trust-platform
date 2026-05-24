import { prisma } from '@/lib/db';
import { inviteUserToRoom, kickUserFromRoom } from '@/lib/matrix/rooms';
import { logger } from '@/lib/logger';
import { getPlatformSettings } from '@/lib/platform/config';
import { calculatePlatformFee, getPriceForCycle, buildPaymentReference } from '@/lib/payments/fees';

export type BillingCycle = 'monthly' | 'yearly' | 'lifetime';

export function calculateExpiresAt(cycle: BillingCycle, from = new Date()): Date | null {
  const expires = new Date(from);
  if (cycle === 'monthly') {
    expires.setMonth(expires.getMonth() + 1);
    return expires;
  }
  if (cycle === 'yearly') {
    expires.setFullYear(expires.getFullYear() + 1);
    return expires;
  }
  return null;
}

export async function activateSubscription(params: {
  userId: string;
  groupId: string;
  paymentTxSig: string;
  paymentChain?: string;
  cycle: BillingCycle;
}): Promise<{
  amountUsd: number;
  platformFeeUsd: number;
  expertNetUsd: number;
}> {
  const { userId, groupId, paymentTxSig, paymentChain = 'polygon', cycle } = params;

  const [user, group] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId } }),
    prisma.group.findUnique({
      where: { id: groupId },
      include: { owner: true },
    }),
  ]);

  if (!user || !group) {
    throw new Error('User or group not found');
  }

  const settings = await getPlatformSettings();
  const amountUsd = getPriceForCycle(cycle, group);
  const { platformFeeUsd, expertNetUsd, platformFeeBps } = calculatePlatformFee(
    amountUsd,
    settings.platformFeeBps
  );

  const paymentReference = buildPaymentReference(groupId, userId);
  const expiresAt = calculateExpiresAt(cycle);

  const existing = await prisma.subscription.findUnique({
    where: { paymentTxSig },
  });
  if (existing) {
    throw new Error('Payment already used');
  }

  await prisma.$transaction(async (tx) => {
    await tx.subscription.create({
      data: {
        userId,
        groupId,
        paymentTxSig,
        paymentChain,
        paymentReference,
        amountUsd,
        platformFeeUsd,
        expertNetUsd,
        platformFeeBps,
        expertPayoutStatus: 'pending',
        expiresAt,
        status: 'active',
      },
    });

    await tx.groupMember.upsert({
      where: { userId_groupId: { userId, groupId } },
      create: { userId, groupId, role: 'member' },
      update: {},
    });

    await tx.group.update({
      where: { id: groupId },
      data: { subscriberCount: { increment: 1 } },
    });

    await tx.user.update({
      where: { id: group.ownerId },
      data: {
        expertBalanceUsd: { increment: expertNetUsd },
      },
    });
  });

  if (user.matrixUserId && group.matrixRoomId) {
    await inviteUserToRoom(group.matrixRoomId, user.matrixUserId);
    logger.info({ userId, groupId, platformFeeUsd, expertNetUsd }, 'Subscription activated');
  }

  return { amountUsd, platformFeeUsd, expertNetUsd };
}

export async function expireSubscription(subscriptionId: string): Promise<void> {
  const sub = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { user: true, group: true },
  });

  if (!sub || sub.status !== 'active') return;

  await prisma.subscription.update({
    where: { id: subscriptionId },
    data: { status: 'expired' },
  });

  await prisma.groupMember.deleteMany({
    where: { userId: sub.userId, groupId: sub.groupId },
  });

  await prisma.group.update({
    where: { id: sub.groupId },
    data: { subscriberCount: { decrement: 1 } },
  });

  if (sub.user.matrixUserId && sub.group.matrixRoomId) {
    await kickUserFromRoom(sub.group.matrixRoomId, sub.user.matrixUserId, 'Subscription expired');
  }
}

export async function expireAllDueSubscriptions(): Promise<number> {
  const expired = await prisma.subscription.findMany({
    where: {
      status: 'active',
      expiresAt: { lt: new Date() },
    },
  });

  for (const sub of expired) {
    await expireSubscription(sub.id);
  }

  return expired.length;
}
