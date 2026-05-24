import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const wallet = await prisma.wallet.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!wallet) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const count = await prisma.wallet.count({ where: { userId: session.user.id } });
  if (count <= 1) {
    return NextResponse.json({ error: 'Cannot remove your only wallet' }, { status: 400 });
  }

  await prisma.wallet.delete({ where: { id } });

  if (wallet.isPrimary) {
    const next = await prisma.wallet.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'asc' },
    });
    if (next) {
      await prisma.wallet.update({
        where: { id: next.id },
        data: { isPrimary: true },
      });
      await prisma.user.update({
        where: { id: session.user.id },
        data: { walletAddress: next.address },
      });
    }
  }

  return NextResponse.json({ ok: true });
}
