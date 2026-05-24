import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CHAINS, type ChainId, getChain } from '@/lib/chains/config';
import { linkWalletToUser } from '@/lib/wallets/service';

const linkSchema = z.object({
  chain: z.string().refine((c): c is ChainId => c in CHAINS),
  address: z.string().min(20).max(66),
  message: z.string().min(10),
  signature: z.string().min(10),
  label: z.string().max(64).optional(),
  setPrimary: z.boolean().optional(),
});

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const wallets = await prisma.wallet.findMany({
    where: { userId: session.user.id },
    orderBy: [{ isPrimary: 'desc' }, { createdAt: 'asc' }],
  });

  return NextResponse.json({
    wallets: wallets.map((w) => ({
      id: w.id,
      address: w.address,
      chain: w.chain,
      chainName: getChain(w.chain as ChainId)?.name ?? w.chain,
      label: w.label,
      isPrimary: w.isPrimary,
      lastSyncedAt: w.lastSyncedAt,
    })),
    note: 'Trading performance is synced per chain. Solana Memo is only for prediction attestation.',
  });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = linkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request', details: parsed.error.flatten() }, { status: 400 });
  }

  try {
    const wallet = await linkWalletToUser({
      userId: session.user.id,
      ...parsed.data,
    });
    return NextResponse.json({ wallet });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to link wallet';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
