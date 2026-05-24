import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { validateServiceTypes } from '@/lib/experts/service-types';

const patchSchema = z.object({
  expertHeadline: z.string().max(120).optional(),
  expertBio: z.string().max(2000).optional(),
  expertServiceTypes: z.array(z.string()).max(8).optional(),
  acceptsAgentApi: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      expertHeadline: true,
      expertBio: true,
      expertServiceTypes: true,
      acceptsAgentApi: true,
      matrixUserId: true,
    },
  });

  return NextResponse.json({ profile: user });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = patchSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const types =
    parsed.data.expertServiceTypes != null
      ? validateServiceTypes(parsed.data.expertServiceTypes)
      : undefined;

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      expertHeadline: parsed.data.expertHeadline,
      expertBio: parsed.data.expertBio,
      expertServiceTypes: types,
      acceptsAgentApi: parsed.data.acceptsAgentApi,
    },
    select: {
      expertHeadline: true,
      expertBio: true,
      expertServiceTypes: true,
      acceptsAgentApi: true,
    },
  });

  return NextResponse.json({ profile: user });
}
