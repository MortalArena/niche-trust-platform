import Decimal from 'decimal.js';
import type { TradeRecord } from './types';

export function calculateROI(trades: TradeRecord[]): number {
  if (trades.length === 0) return 0;

  let totalPnL = new Decimal(0);
  let totalCapital = new Decimal(0);

  for (const trade of trades) {
    const pnl = new Decimal(trade.exitPrice)
      .minus(trade.entryPrice)
      .times(trade.size);
    totalPnL = totalPnL.plus(pnl);
    totalCapital = totalCapital.plus(new Decimal(trade.entryPrice).times(trade.size));
  }

  if (totalCapital.isZero()) return 0;
  return totalPnL.dividedBy(totalCapital).times(100).toNumber();
}
