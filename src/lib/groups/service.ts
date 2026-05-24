import { prisma } from '@/lib/db';
import { createEncryptedRoom } from '@/lib/matrix/rooms';
import { isMatrixConfigured } from '@/lib/matrix/client';

export async function createGroup(params: {
  ownerId: string;
  name: string;
  description?: string;
  categorySlug: string;
  subcategorySlug?: string;
  monthlyPriceUsd: number;
  yearlyPriceUsd?: number;
  lifetimePriceUsd?: number;
  isPublic?: boolean;
  serviceTypes?: string[];
  allowPublicComments?: boolean;
}) {
  let matrixRoomId: string | null = null;

  const owner = await prisma.user.findUnique({
    where: { id: params.ownerId },
    select: { matrixUserId: true },
  });

  if (isMatrixConfigured()) {
    matrixRoomId = await createEncryptedRoom(
      params.name,
      owner?.matrixUserId ? [owner.matrixUserId] : []
    );
  }

  const group = await prisma.group.create({
    data: {
      ownerId: params.ownerId,
      name: params.name,
      description: params.description,
      categorySlug: params.categorySlug,
      subcategorySlug: params.subcategorySlug,
      monthlyPriceUsd: params.monthlyPriceUsd,
      yearlyPriceUsd: params.yearlyPriceUsd,
      lifetimePriceUsd: params.lifetimePriceUsd,
      isPublic: params.isPublic ?? false,
      serviceTypes: params.serviceTypes ?? [],
      allowPublicComments: params.allowPublicComments ?? true,
      matrixRoomId,
    },
  });

  await prisma.groupMember.create({
    data: {
      userId: params.ownerId,
      groupId: group.id,
      role: 'admin',
    },
  });

  return group;
}

export async function userHasActiveSubscription(
  userId: string,
  groupId: string
): Promise<boolean> {
  const sub = await prisma.subscription.findFirst({
    where: {
      userId,
      groupId,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
  });
  return Boolean(sub);
}
