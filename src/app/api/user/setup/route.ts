import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const setupSchema = z.object({
  isAnonymous: z.boolean(),
  displayName: z.string().max(30).optional(),
  role: z.enum(['expert', 'subscriber']),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = setupSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { isAnonymous, displayName, role } = parsed.data;
  const updateData: Record<string, unknown> = { isAnonymous, isSetupComplete: true, role };
  if (displayName?.trim()) {
    updateData.displayName = displayName.trim();
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData as any,
  });

  return NextResponse.json({ success: true });
}