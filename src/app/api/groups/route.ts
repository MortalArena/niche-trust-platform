import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { createGroup } from '@/lib/groups/service';
import { getAllCategorySlugs } from '@/lib/markets/categories';

const createSchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(500).optional(),
  categorySlug: z.string().refine((s) => getAllCategorySlugs().includes(s)),
  subcategorySlug: z.string().optional(),
  monthlyPriceUsd: z.number().min(0),
  yearlyPriceUsd: z.number().min(0).optional(),
  lifetimePriceUsd: z.number().min(0).optional(),
  isPublic: z.boolean().optional(),
  serviceTypes: z.array(z.string()).max(8).optional(),
  allowPublicComments: z.boolean().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const groups = await prisma.group.findMany({
    where: {
      isPublic: true,
      ...(category ? { categorySlug: category } : {}),
    },
    orderBy: { subscriberCount: 'desc' },
    take: 50,
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
          scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' } },
        },
      },
    },
  });

  return NextResponse.json({ groups });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data', details: parsed.error.flatten() }, { status: 400 });
  }

  const group = await createGroup({
    ownerId: session.user.id,
    ...parsed.data,
  });

  return NextResponse.json({ group });
}
