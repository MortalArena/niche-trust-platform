import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { isAdminWallet } from '@/lib/platform/config';

export async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: 'unauthorized' as const, session: null };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true, walletAddress: true, displayName: true },
  });

  if (!user) {
    return { error: 'unauthorized' as const, session: null };
  }

  const isAdmin = user.role === 'admin' || isAdminWallet(user.walletAddress);
  if (!isAdmin) {
    return { error: 'forbidden' as const, session: null };
  }

  return { error: null, session, user };
}

export async function promoteAdminIfWallet(userId: string, walletAddress: string | null) {
  if (!walletAddress || !isAdminWallet(walletAddress)) return;
  await prisma.user.update({
    where: { id: userId },
    data: { role: 'admin' },
  });
}
