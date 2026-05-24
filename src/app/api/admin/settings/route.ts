import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings } from '@/lib/platform/config';

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const settings = await getPlatformSettings();
  return NextResponse.json({
    settings,
    envWallets: {
      polygon: process.env.PLATFORM_WALLET_POLYGON ?? null,
      solana: process.env.PLATFORM_WALLET_SOLANA ?? null,
    },
  });
}

const patchSchema = z.object({
  platformFeeBps: z.number().int().min(0).max(2000).optional(),
  platformWalletPolygon: z.string().optional(),
  platformWalletSolana: z.string().optional(),
});

export async function PATCH(req: Request) {
  const admin = await requireAdmin();
  if (admin.error || !admin.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const settings = await prisma.platformSettings.upsert({
    where: { id: 'default' },
    update: parsed.data,
    create: { id: 'default', ...parsed.data, platformFeeBps: parsed.data.platformFeeBps ?? 500 },
  });

  await prisma.adminAuditLog.create({
    data: {
      adminId: admin.user.id,
      action: 'update_settings',
      metadata: parsed.data,
    },
  });

  return NextResponse.json({ settings });
}
