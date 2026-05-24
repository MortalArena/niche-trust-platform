import { describe, it, expect } from 'vitest';
import { calculateTrustScore } from '@/lib/analytics/trustscore';
import type { TradeRecord } from '@/lib/analytics/types';

const winningTrade: TradeRecord = {
  pnl: 10,
  entryPrice: 100,
  exitPrice: 110,
  size: 1,
  entryTime: 0,
  exitTime: 1,
};

describe('Trust Score Engine', () => {
  it('يعطي درجة عالية للمضارب المثالي', () => {
    const result = calculateTrustScore({
      trades: Array(100).fill(winningTrade),
      monthlyReturns: [5, 6, 4, 7, 5, 6],
      equityCurve: [100, 110, 120, 130, 140, 150],
      tradeCount: 100,
      activityDays: 90,
    });
    expect(result.trustScore).toBeGreaterThan(55);
    expect(result.winRate).toBe(100);
  });

  it('يعاقب على Drawdown عالٍ', () => {
    const result = calculateTrustScore({
      trades: Array(50).fill({ ...winningTrade, pnl: -20, exitPrice: 80 }),
      monthlyReturns: [-30, -20, 40, -15],
      equityCurve: [100, 70, 50, 90, 75],
      tradeCount: 50,
      activityDays: 60,
    });
    expect(result.trustScore).toBeLessThan(60);
  });

  it('يعيد قيمة ضمن 0-100 للبيانات الفارغة', () => {
    const result = calculateTrustScore({
      trades: [],
      monthlyReturns: [],
      equityCurve: [],
      tradeCount: 0,
      activityDays: 0,
    });
    expect(result.trustScore).toBeGreaterThanOrEqual(0);
    expect(result.trustScore).toBeLessThanOrEqual(100);
  });
});
