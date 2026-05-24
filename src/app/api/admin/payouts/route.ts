import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAdmin } from '@/lib/admin/auth';
import { prisma } from '@/lib/db';

export async function GET() {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const pending = await prisma.subscription.findMany({
    where: { expertPayoutStatus: 'pending' },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      group: { select: { name: true, owner: { select: { id: true, displayName: true, walletAddress: true, expertBalanceUsd: true } } } },
      user: { select: { displayName: true } },
    },
  });

  return NextResponse.json({ pending });
}

const payoutSchema = z.object({
  subscriptionId: z.string(),
  payoutTxSig: z.string().min(10),
  chain: z.string().optional(),
});

export async function POST(req: Request) {
  const admin = await requireAdmin();
  if (admin.error || !admin.user) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const parsed = payoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { id: parsed.data.subscriptionId },
    include: { group: true },
  });

  if (!sub || sub.expertPayoutStatus !== 'pending') {
    return NextResponse.json({ error: 'Subscription not found or already paid' }, { status: 404 });
  }

  const expertId = sub.group.ownerId;
  const net = Number(sub.expertNetUsd);

  await prisma.$transaction(async (tx) => {
    await tx.subscription.update({
      where: { id: sub.id },
      data: {
        expertPayoutStatus: 'paid',
        expertPayoutTxSig: parsed.data.payoutTxSig,
      },
    });

    await tx.user.update({
      where: { id: expertId },
      data: {
        expertBalanceUsd: { decrement: net },
        totalPaidOutUsd: { increment: net },
      },
    });

    await tx.expertPayout.create({
      data: {
        expertId,
        amountUsd: net,
        txSig: parsed.data.payoutTxSig,
        chain: parsed.data.chain ?? sub.paymentChain,
        status: 'completed',
        completedAt: new Date(),
        note: `Subscription ${sub.id}`,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId: admin.user.id,
        action: 'expert_payout',
        target: sub.id,
        metadata: { expertId, amountUsd: net, txSig: parsed.data.payoutTxSig },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
