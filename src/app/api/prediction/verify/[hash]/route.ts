import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rpcPool } from '@/lib/solana/rpc-pool';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  const { hash } = await params;

  try {
    const prediction = await prisma.prediction.findUnique({
      where: { contentHash: hash },
      include: { 
        author: { select: { id: true, walletAddress: true, displayName: true } },
        group: { select: { id: true, name: true } },
      },
    });

    if (!prediction) {
      return NextResponse.json({ 
        verified: false, 
        reason: 'Not found',
        hash,
      });
    }

    // On-chain verification
    let onChainVerified = false;
    let onChainTx = null;
    if (prediction.solanaTxSig) {
      try {
        const tx = await rpcPool.call((conn) =>
          conn.getParsedTransaction(prediction.solanaTxSig!, {
            maxSupportedTransactionVersion: 0,
          })
        );
        onChainVerified = tx !== null && tx.meta?.err == null;
        onChainTx = tx?.blockTime || null;
      } catch (error) {
        console.error('On-chain verification failed:', error);
      }
    }

    return NextResponse.json({
      verified: onChainVerified && prediction.onChainStatus === 'confirmed',
      prediction: {
        id: prediction.id,
        title: prediction.title,
        category: prediction.category,
        asset: prediction.asset,
        question: prediction.question,
        predictedOutcome: prediction.predictedOutcome,
        author: {
          displayName: prediction.author.displayName,
          walletAddress: prediction.author.walletAddress,
        },
        group: prediction.group ? { name: prediction.group.name } : null,
        createdAt: prediction.createdAt,
        expiresAt: prediction.expiresAt,
        outcome: prediction.outcome,
        onChainStatus: prediction.onChainStatus,
        solanaTxSig: prediction.solanaTxSig,
        contentHash: prediction.contentHash,
        verificationSource: prediction.predictionSource,
        externalUrl: prediction.externalUrl,
      },
    });
  } catch (error) {
    console.error('Verify prediction error:', error);
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 });
  }
}