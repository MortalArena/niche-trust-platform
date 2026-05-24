import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const key = await prisma.agentKey.findFirst({
    where: { id, userId: session.user.id },
  });

  if (!key) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await prisma.agentKey.update({
    where: { id },
    data: { isActive: false },
  });

  return NextResponse.json({ ok: true });
}
