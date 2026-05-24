import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CHAINS, type ChainId } from '@/lib/chains/config';
import { activateSubscription, type BillingCycle } from '@/lib/subscriptions/manager';
import { buildPaymentReference } from '@/lib/payments/fees';
import { assertPlatformWalletConfigured, verifyPlatformPayment } from '@/lib/payments/verify-platform-payment';

const subscribeSchema = z.object({
  paymentTxSig: z.string().min(32).max(128),
  paymentChain: z.string().refine((c): c is ChainId => c in CHAINS),
  cycle: z.enum(['monthly', 'yearly', 'lifetime']),
});

export async function POST(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await context.params;
  const body = await req.json();
  const parsed = subscribeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
  }

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: 'Group not found' }, { status: 404 });
  }

  if (group.ownerId === session.user.id) {
    return NextResponse.json({ error: 'Owner cannot subscribe to own group' }, { status: 400 });
  }

  let platformWallet: string;
  try {
    platformWallet = assertPlatformWalletConfigured(parsed.data.paymentChain);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Platform wallet not configured' },
      { status: 503 }
    );
  }

  const paymentReference = buildPaymentReference(groupId, session.user.id);

  const verification = await verifyPlatformPayment({
    txSig: parsed.data.paymentTxSig,
    chain: parsed.data.paymentChain,
    platformWallet,
    paymentReference,
  });

  if (!verification.valid) {
    return NextResponse.json(
      { error: verification.reason ?? 'Payment verification failed' },
      { status: 400 }
    );
  }

  try {
    const payment = await activateSubscription({
      userId: session.user.id,
      groupId,
      paymentTxSig: parsed.data.paymentTxSig,
      paymentChain: parsed.data.paymentChain,
      cycle: parsed.data.cycle as BillingCycle,
    });

    const updated = await prisma.group.findUnique({
      where: { id: groupId },
      select: { matrixRoomId: true },
    });

    return NextResponse.json({
      success: true,
      groupId,
      matrixRoomId: updated?.matrixRoomId,
      payment: {
        ...payment,
        message: `Platform fee $${payment.platformFeeUsd} (5%) retained. Expert receives $${payment.expertNetUsd}.`,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Subscription failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
