import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const expertSchema = z.object({
  expertHeadline: z.string().min(1).max(100),
  expertBio: z.string().max(500).optional(),
  serviceTypes: z.array(z.string()).min(1),
  defaultPrice: z.number().min(1).max(99999),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = expertSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const { expertHeadline, expertBio, serviceTypes, defaultPrice } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      expertHeadline,
      expertBio: expertBio ?? null,
      expertServiceTypes: serviceTypes,
      isSetupComplete: true,
    },
  });

  // Create or update the expert's default group
  const existingGroup = await prisma.group.findFirst({
    where: { ownerId: session.user.id },
  });

  if (existingGroup) {
    await prisma.group.update({
      where: { id: existingGroup.id },
      data: { monthlyPriceUsd: defaultPrice, serviceTypes },
    });
  } else {
    await prisma.group.create({
      data: {
        ownerId: session.user.id,
        name: `${expertHeadline.slice(0, 30)}'s Group`,
        description: expertBio ?? undefined,
        monthlyPriceUsd: defaultPrice,
        serviceTypes,
        isPublic: true,
      },
    });
  }
  return NextResponse.json({ success: true });
}