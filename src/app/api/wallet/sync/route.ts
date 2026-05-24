import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { CHAINS, type ChainId } from '@/lib/chains/config';
import { syncWalletByChain } from '@/lib/wallet/sync-wallet';
import { enqueueWalletSync } from '@/lib/queue/wallet-sync';

const bodySchema = z.object({
  walletAddress: z.string().min(20).max(66).optional(),
  chain: z.string().refine((c): c is ChainId => c in CHAINS).optional(),
  limit: z.number().int().min(10).max(1000).optional(),
  async: z.boolean().optional(),
});

export const maxDuration = 300;

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const wallet = parsed.data.walletAddress
    ? await prisma.wallet.findFirst({
        where: {
          userId: session.user.id,
          address: parsed.data.walletAddress,
          ...(parsed.data.chain ? { chain: parsed.data.chain } : {}),
        },
      })
    : await prisma.wallet.findFirst({
        where: { userId: session.user.id, isPrimary: true },
      });

  if (!wallet) {
    return NextResponse.json({ error: 'Wallet not linked' }, { status: 404 });
  }

  if (parsed.data.async) {
    const jobId = await enqueueWalletSync(
      session.user.id,
      wallet.address,
      wallet.chain as ChainId
    );
    if (jobId) {
      return NextResponse.json({ status: 'queued', jobId });
    }
  }

  const result = await syncWalletByChain(
    wallet.address,
    wallet.chain as ChainId,
    parsed.data.limit ?? 300
  );
  return NextResponse.json(result);
}
