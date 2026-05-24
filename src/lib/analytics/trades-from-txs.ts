import type { CachedTransaction } from '@prisma/client';
import type { TradeRecord } from './types';

/** يبني سجلات تداول من معاملات swap المخزنة */
export function buildTradesFromTransactions(transactions: CachedTransaction[]): TradeRecord[] {
  const swaps = transactions
    .filter((tx) => tx.type === 'swap' || tx.type === 'transfer')
    .filter((tx) => tx.amountIn != null && tx.amountOut != null)
    .sort((a, b) => a.blockTime - b.blockTime);

  const trades: TradeRecord[] = [];

  for (let i = 0; i < swaps.length; i++) {
    const tx = swaps[i];
    const amountIn = Number(tx.amountIn ?? 0);
    const amountOut = Number(tx.amountOut ?? 0);
    if (amountIn <= 0) continue;

    const pnl = amountOut - amountIn;
    trades.push({
      pnl,
      entryPrice: amountIn,
      exitPrice: amountOut,
      size: 1,
      entryTime: tx.blockTime,
      exitTime: tx.blockTime,
    });
  }

  return trades;
}

export function buildEquityCurve(trades: TradeRecord[], startEquity = 100): number[] {
  const curve: number[] = [startEquity];
  let equity = startEquity;
  for (const t of trades) {
    equity += t.pnl;
    curve.push(equity);
  }
  return curve.length ? curve : [startEquity];
}

export function buildMonthlyReturns(trades: TradeRecord[]): number[] {
  if (trades.length === 0) return [];

  const byMonth = new Map<string, number>();
  for (const t of trades) {
    const date = new Date(t.exitTime * 1000);
    const key = `${date.getUTCFullYear()}-${date.getUTCMonth()}`;
    byMonth.set(key, (byMonth.get(key) ?? 0) + t.pnl);
  }

  return Array.from(byMonth.values());
}

export function estimateActivityDays(transactions: CachedTransaction[]): number {
  if (transactions.length === 0) return 30;
  const times = transactions.map((t) => t.blockTime);
  const min = Math.min(...times);
  const max = Math.max(...times);
  const days = Math.max(1, Math.ceil((max - min) / 86400));
  return Math.min(days, 365);
}
