import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { rpcPool } from '@/lib/solana/rpc-pool';
import { writeHashOnChain, getMemoKeypair } from '@/lib/solana/memo';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

/**
 * Cron job: كل 10 دقائق
 * 1. Retry pending/failed memos
 * 2. Check expired predictions for auto-verification
 * 3. Update outcomes based on on-chain data
 */
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, any> = {};

  try {
    // --- Task 1: Retry pending memos ---
    const pendingMemos = await prisma.prediction.findMany({
      where: { 
        onChainStatus: { in: ['pending', 'failed'] },
        verificationAttempts: { lt: 5 },
      },
      take: 20,
      orderBy: { createdAt: 'asc' },
    });

    let memoSuccesses = 0;
    for (const pred of pendingMemos) {
      try {
        const sig = await writeHashOnChain(pred.contentHash);
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { 
            solanaTxSig: sig, 
            onChainStatus: 'confirmed',
            verificationAttempts: { increment: 1 },
          },
        });
        memoSuccesses++;
      } catch (err: any) {
        await prisma.prediction.update({
          where: { id: pred.id },
          data: { 
            verificationAttempts: { increment: 1 },
            lastVerificationError: err.message,
          },
        });
      }
    }
    results.memoRetries = { attempted: pendingMemos.length, succeeded: memoSuccesses };

    // --- Task 2: Check expired predictions ---
    const expiredPredictions = await prisma.prediction.findMany({
      where: {
        expiresAt: { lte: new Date() },
        outcome: 'PENDING',
        solanaTxSig: { not: null },
      },
      take: 50,
    });

    let verifiedCount = 0;
    for (const pred of expiredPredictions) {
      const p = pred as any;
      try {
        if (p.externalMarketId) {
          // Try to fetch outcome from Polymarket/Kalshi
          // For now, mark as requires manual verification
          await prisma.prediction.update({
            where: { id: pred.id },
            data: { outcome: 'VOID', verifiedAt: new Date() },
          });
          verifiedCount++;
        } else if (p.asset && p.targetPrice) {
          // Fetch current price and compare
          // Simple price check via Jupiter API for Solana tokens
          const price = await fetchTokenPrice(p.asset);
          if (price !== null && p.targetPrice) {
            const isWin = p.category === 'price_action' 
              ? price >= Number(p.targetPrice)
              : price <= Number(p.targetPrice);
            
            await prisma.prediction.update({
              where: { id: pred.id },
              data: { 
                outcome: isWin ? 'WIN' : 'LOSS', 
                resolvedPrice: price,
                resolvedAt: new Date(),
                verifiedAt: new Date(),
              },
            });
            verifiedCount++;
          }
        }
      } catch (err: any) {
        logger.error({ predictionId: pred.id, error: err.message }, 'Auto-verify failed');
      }
    }
    results.expiredChecked = { total: expiredPredictions.length, verified: verifiedCount };

    // --- Task 3: Update TraderScores based on new outcomes ---
    const authorIds = expiredPredictions
      .filter(p => p.outcome !== 'PENDING')
      .map(p => p.authorId);
    
    const uniqueAuthorIds = [...new Set(authorIds)];
    for (const authorId of uniqueAuthorIds) {
      await recalculateTraderScore(authorId);
    }
    results.scoresRecalculated = uniqueAuthorIds.length;

    return NextResponse.json({ 
      success: true, 
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    logger.error({ error: error.message }, 'Cron job failed');
    return NextResponse.json({ 
      success: false, 
      error: error.message,
      partialResults: results,
    }, { status: 500 });
  }
}

async function fetchTokenPrice(asset: string): Promise<number | null> {
  try {
    // Use Jupiter Price API v2 (free, no API key needed)
    const url = `https://price.jup.ag/v6/price?ids=${asset.toUpperCase()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    return data?.data?.[asset.toUpperCase()]?.price ?? null;
  } catch {
    // Fallback to Birdeye API
    try {
      const url = `https://public-api.birdeye.so/public/price?address=${asset}`;
      const res = await fetch(url, { 
        signal: AbortSignal.timeout(5000),
        headers: { 'x-chain': 'solana' },
      });
      const data = await res.json();
      return data?.data?.value ?? null;
    } catch {
      return null;
    }
  }
}

async function recalculateTraderScore(userId: string) {
  const predictions = await prisma.prediction.findMany({
    where: { 
      authorId: userId,
      outcome: { in: ['WIN', 'LOSS'] },
    },
    select: { outcome: true },
  });

  const totalPredictions = predictions.length;
  if (totalPredictions === 0) return;

  const wins = predictions.filter(p => p.outcome === 'WIN').length;
  const winRate = (wins / totalPredictions) * 100;

  await prisma.traderScore.upsert({
    where: { userId },
    update: {
      winRate: Math.round(winRate * 100) / 100,
      totalTrades: totalPredictions,
      winningTrades: wins,
      lastCalculatedAt: new Date(),
    },
    create: {
      userId,
      winRate: Math.round(winRate * 100) / 100,
      totalTrades: totalPredictions,
      winningTrades: wins,
      lastCalculatedAt: new Date(),
    },
  });
}