import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';

const createSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(3000).optional(),
  pricingModel: z.enum(['free', 'sell', 'rent', 'course']),
  priceUsd: z.number().min(0).optional(),
  categorySlug: z.string().optional(),
  platform: z.string().max(80).optional(),
  externalUrl: z.string().url().optional(),
  isPublic: z.boolean().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const expertId = searchParams.get('expertId');

  const bots = await prisma.expertBot.findMany({
    where: {
      isPublic: true,
      ...(expertId ? { expertId } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: {
      expert: { select: { id: true, displayName: true, walletAddress: true, expertServiceTypes: true } },
    },
  });

  return NextResponse.json({ bots });
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

  const bot = await prisma.expertBot.create({
    data: {
      expertId: session.user.id,
      name: parsed.data.name,
      description: parsed.data.description,
      pricingModel: parsed.data.pricingModel,
      priceUsd: parsed.data.priceUsd,
      categorySlug: parsed.data.categorySlug ?? 'crypto',
      platform: parsed.data.platform,
      externalUrl: parsed.data.externalUrl,
      isPublic: parsed.data.isPublic ?? true,
    },
  });

  return NextResponse.json({ bot });
}
