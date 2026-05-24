import { prisma } from '@/lib/db';
import { userHasActiveSubscription } from '@/lib/groups/service';

export async function canPostComment(
  userId: string,
  group: { id: string; isPublic: boolean; allowPublicComments: boolean; ownerId: string }
): Promise<boolean> {
  if (group.ownerId === userId) return true;
  if (group.isPublic && group.allowPublicComments) return true;
  return userHasActiveSubscription(userId, group.id);
}

export async function canViewComments(
  userId: string | null,
  group: { id: string; isPublic: boolean; ownerId: string }
): Promise<boolean> {
  if (group.isPublic) return true;
  if (!userId) return false;
  if (group.ownerId === userId) return true;
  return userHasActiveSubscription(userId, group.id);
}
