import type { CachedTransaction } from '@prisma/client';
import { prisma } from '@/lib/db';
import { calculateTrustScore } from '@/lib/analytics/trustscore';
import {
  buildEquityCurve,
  buildMonthlyReturns,
  buildTradesFromTransactions,
  estimateActivityDays,
} from '@/lib/analytics/trades-from-txs';
import { PERFORMANCE_CHAINS, type ChainId } from '@/lib/chains/config';
import { syncWalletByChain } from '@/lib/wallet/sync-wallet';

export async function syncAndAnalyzeWallet(
  userId: string,
  walletAddress: string,
  chain: ChainId,
  options?: { syncLimit?: number; skipSync?: boolean }
) {
  const wallet = await prisma.wallet.findFirst({
    where: { address: walletAddress, chain, userId },
  });

  if (!wallet) {
    throw new Error('Wallet not linked to your account');
  }

  let syncResult = null;
  if (!options?.skipSync) {
    syncResult = await syncWalletByChain(walletAddress, chain, options?.syncLimit ?? 300);
  }

  const updated = await prisma.wallet.findUnique({
    where: { id: wallet.id },
    include: { transactions: { orderBy: { blockTime: 'asc' }, take: 1000 } },
  });

  const score = scoreFromTransactions(updated?.transactions ?? []);

  return {
    walletAddress,
    chain,
    sync: syncResult,
    transactionCount: updated?.transactions.length ?? 0,
    ...score,
  };
}

/** Aggregate all linked wallets — each chain analyzed on its own RPC, not via Solana */
export async function syncAndAnalyzeAllWallets(
  userId: string,
  options?: { syncLimit?: number; skipSync?: boolean; chains?: ChainId[] }
) {
  const wallets = await prisma.wallet.findMany({ where: { userId } });

  if (wallets.length === 0) {
    throw new Error('No wallets linked. Add a Polygon or Solana wallet first.');
  }

  const targetChains = options?.chains ?? PERFORMANCE_CHAINS;
  const syncResults: unknown[] = [];
  const chainBreakdown: Record<string, { trustScore: number; trades: number; txs: number }> =
    {};

  for (const wallet of wallets) {
    if (!targetChains.includes(wallet.chain as ChainId)) continue;

    if (!options?.skipSync) {
      try {
        const r = await syncWalletByChain(
          wallet.address,
          wallet.chain as ChainId,
          options?.syncLimit ?? 300
        );
        syncResults.push(r);
      } catch (err) {
        syncResults.push({
          chain: wallet.chain,
          error: err instanceof Error ? err.message : 'sync failed',
        });
      }
    }
  }

  const allWallets = await prisma.wallet.findMany({
    where: { userId },
    include: { transactions: { orderBy: { blockTime: 'asc' }, take: 2000 } },
  });

  const allTransactions = allWallets.flatMap((w) => w.transactions);

  for (const w of allWallets) {
    const wScore = scoreFromTransactions(w.transactions);
    chainBreakdown[w.chain] = {
      trustScore: wScore.trustScore,
      trades: wScore.totalTrades,
      txs: w.transactions.length,
    };
  }

  const aggregate = scoreFromTransactions(allTransactions);

  await prisma.traderScore.upsert({
    where: { userId },
    update: {
      roi: aggregate.roi,
      winRate: aggregate.winRate,
      maxDrawdown: aggregate.maxDrawdown,
      consistency: aggregate.consistency,
      profitFactor: aggregate.profitFactor,
      trustScore: aggregate.trustScore,
      riskLevel: aggregate.riskLevel,
      totalTrades: aggregate.totalTrades,
      winningTrades: aggregate.winningTrades,
      losingTrades: aggregate.losingTrades,
      chainBreakdown,
      lastCalculatedAt: new Date(),
    },
    create: {
      userId,
      roi: aggregate.roi,
      winRate: aggregate.winRate,
      maxDrawdown: aggregate.maxDrawdown,
      consistency: aggregate.consistency,
      profitFactor: aggregate.profitFactor,
      trustScore: aggregate.trustScore,
      riskLevel: aggregate.riskLevel,
      totalTrades: aggregate.totalTrades,
      winningTrades: aggregate.winningTrades,
      losingTrades: aggregate.losingTrades,
      chainBreakdown,
    },
  });

  return {
    walletCount: wallets.length,
    syncResults,
    transactionCount: allTransactions.length,
    chainBreakdown,
    ...aggregate,
  };
}

function scoreFromTransactions(transactions: CachedTransaction[]) {
  const trades = buildTradesFromTransactions(transactions);
  const equityCurve = buildEquityCurve(trades);
  const monthlyReturns = buildMonthlyReturns(trades);
  const activityDays = estimateActivityDays(transactions);

  const result = calculateTrustScore({
    trades,
    monthlyReturns,
    equityCurve,
    tradeCount: trades.length,
    activityDays,
  });

  return {
    ...result,
    totalTrades: trades.length,
    winningTrades: trades.filter((t) => t.pnl > 0).length,
    losingTrades: trades.filter((t) => t.pnl < 0).length,
  };
}
