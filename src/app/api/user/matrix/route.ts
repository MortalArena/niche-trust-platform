import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { inviteUserToRoom } from '@/lib/matrix/rooms';
import { isMatrixConfigured } from '@/lib/matrix/client';

const bodySchema = z.object({
  matrixUserId: z.string().regex(/^@[^:]+:.+$/),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Matrix ID (e.g. @user:localhost)' }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { matrixUserId: parsed.data.matrixUserId },
  });

  let roomsInvited = 0;
  if (isMatrixConfigured()) {
    const subs = await prisma.subscription.findMany({
      where: {
        userId: session.user.id,
        status: 'active',
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      include: { group: { select: { matrixRoomId: true } } },
    });

    for (const sub of subs) {
      if (sub.group.matrixRoomId) {
        const ok = await inviteUserToRoom(sub.group.matrixRoomId, parsed.data.matrixUserId);
        if (ok) roomsInvited += 1;
      }
    }
  }

  return NextResponse.json({
    matrixUserId: parsed.data.matrixUserId,
    roomsInvited,
  });
}
