import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { generateAgentKey } from '@/lib/agent/auth';

const createSchema = z.object({
  name: z.string().min(2).max(80),
  permissions: z
    .array(z.enum(['read:subscriptions', 'read:signals', 'read:groups', 'read:bots']))
    .optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = await prisma.agentKey.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      keyPrefix: true,
      permissions: true,
      isActive: true,
      lastUsedAt: true,
      expiresAt: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ keys });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { raw, hash, prefix } = generateAgentKey();

  const key = await prisma.agentKey.create({
    data: {
      userId: session.user.id,
      name: parsed.data.name,
      keyHash: hash,
      keyPrefix: prefix,
      permissions: parsed.data.permissions ?? [
        'read:subscriptions',
        'read:signals',
        'read:groups',
      ],
    },
  });

  return NextResponse.json({
    key: {
      id: key.id,
      name: key.name,
      keyPrefix: key.keyPrefix,
      permissions: key.permissions,
    },
    secret: raw,
    warning: 'Copy this key now. It will not be shown again.',
  });
}
