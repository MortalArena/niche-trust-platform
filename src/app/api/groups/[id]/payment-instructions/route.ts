import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { getPlatformSettings, getPlatformWalletForChain } from '@/lib/platform/config';
import {
  buildPaymentReference,
  calculatePlatformFee,
  getPriceForCycle,
} from '@/lib/payments/fees';
import type { BillingCycle } from '@/lib/subscriptions/manager';

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id: groupId } = await context.params;
  const cycle = (new URL(req.url).searchParams.get('cycle') ?? 'monthly') as BillingCycle;

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const settings = await getPlatformSettings();
  const amountUsd = getPriceForCycle(cycle, group);
  const { platformFeeUsd, expertNetUsd } = calculatePlatformFee(
    amountUsd,
    settings.platformFeeBps
  );

  const paymentChain = 'polygon';
  const platformWallet = getPlatformWalletForChain(paymentChain);

  if (!platformWallet) {
    return NextResponse.json(
      { error: 'Platform wallet not configured. Contact site admin.' },
      { status: 503 }
    );
  }

  const reference = buildPaymentReference(groupId, session.user.id);

  return NextResponse.json({
    model: 'platform_escrow',
    description:
      'Send the full amount to the platform wallet first. 5% platform fee is deducted automatically; 95% is credited to the expert for payout.',
    paymentChain,
    platformWallet,
    amountUsd,
    platformFeeUsd,
    expertNetUsd,
    platformFeePercent: settings.platformFeeBps / 100,
    paymentReference: reference,
    memo: reference,
    steps: [
      `Send exactly $${amountUsd} USDC (or equivalent) to ${platformWallet}`,
      `Include memo/reference: ${reference}`,
      'Paste the transaction hash below to activate your subscription',
    ],
  });
}
