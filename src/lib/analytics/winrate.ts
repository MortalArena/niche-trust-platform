import type { TradeRecord } from './types';

export function calculateWinRate(trades: TradeRecord[]): number {
  if (trades.length === 0) return 0;
  const wins = trades.filter((t) => t.pnl > 0).length;
  return (wins / trades.length) * 100;
}
