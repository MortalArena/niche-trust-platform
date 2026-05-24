import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { verifyHashOnChain } from '@/lib/solana/memo';

export async function GET(
  _req: Request,
  context: { params: Promise<{ hash: string }> }
) {
  const { hash } = await context.params;

  const prediction = await prisma.prediction.findUnique({
    where: { contentHash: hash },
    include: {
      author: { select: { walletAddress: true, displayName: true } },
    },
  });

  if (!prediction) {
    return NextResponse.json({ verified: false, reason: 'Not found' });
  }

  let onChainVerified = false;
  if (prediction.solanaTxSig) {
    onChainVerified = await verifyHashOnChain(prediction.solanaTxSig);
  }

  return NextResponse.json({
    verified: onChainVerified && prediction.onChainStatus === 'confirmed',
    prediction: {
      id: prediction.id,
      author: prediction.author.walletAddress,
      displayName: prediction.author.displayName,
      createdAt: prediction.createdAt,
      contentHash: prediction.contentHash,
      solanaTxSig: prediction.solanaTxSig,
      onChainStatus: prediction.onChainStatus,
      outcome: prediction.outcome,
      solanaExplorer: prediction.solanaTxSig
        ? `https://solscan.io/tx/${prediction.solanaTxSig}`
        : null,
    },
  });
}
