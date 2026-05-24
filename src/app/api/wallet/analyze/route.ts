import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { CHAINS, type ChainId } from '@/lib/chains/config';
import {
  syncAndAnalyzeAllWallets,
  syncAndAnalyzeWallet,
} from '@/lib/wallet/analyze-wallet';
import { enqueueWalletSync } from '@/lib/queue/wallet-sync';

const bodySchema = z.object({
  walletAddress: z.string().min(20).max(66).optional(),
  chain: z.string().refine((c): c is ChainId => c in CHAINS).optional(),
  limit: z.number().int().min(10).max(500).optional(),
  async: z.boolean().optional(),
  syncAll: z.boolean().optional(),
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

  if (parsed.data.async && parsed.data.walletAddress && parsed.data.chain) {
    const jobId = await enqueueWalletSync(
      session.user.id,
      parsed.data.walletAddress,
      parsed.data.chain
    );
    if (jobId) {
      return NextResponse.json({ status: 'queued', jobId });
    }
  }

  try {
    if (parsed.data.syncAll !== false && !parsed.data.walletAddress) {
      const result = await syncAndAnalyzeAllWallets(session.user.id, {
        syncLimit: parsed.data.limit ?? 300,
      });
      return NextResponse.json({
        ...result,
        message:
          'Aggregated trust score from all linked wallets. Each chain analyzed on its own network.',
      });
    }

    const walletAddress =
      parsed.data.walletAddress ??
      (session.user as { walletAddress?: string }).walletAddress;

    const chain = parsed.data.chain ?? 'polygon';

    if (!walletAddress) {
      return NextResponse.json({ error: 'No wallet specified' }, { status: 400 });
    }

    const result = await syncAndAnalyzeWallet(session.user.id, walletAddress, chain, {
      syncLimit: parsed.data.limit ?? 300,
    });

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
