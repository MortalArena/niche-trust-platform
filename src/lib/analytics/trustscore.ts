import { calculateROI } from './roi';
import { calculateWinRate } from './winrate';
import { calculateMaxDrawdown } from './drawdown';
import { calculateConsistency } from './consistency';
import type { TraderMetrics, TrustScoreResult } from './types';

function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateTrustScore(metrics: TraderMetrics): TrustScoreResult {
  const roi = calculateROI(metrics.trades);
  const winRate = calculateWinRate(metrics.trades);
  const maxDrawdown = calculateMaxDrawdown(metrics.equityCurve);
  const consistency = calculateConsistency(metrics.monthlyReturns);

  const grossProfit = metrics.trades.filter((t) => t.pnl > 0).reduce((s, t) => s + t.pnl, 0);
  const grossLoss = Math.abs(
    metrics.trades.filter((t) => t.pnl < 0).reduce((s, t) => s + t.pnl, 0)
  );
  const profitFactor = grossLoss === 0 ? (grossProfit > 0 ? 10 : 0) : grossProfit / grossLoss;

  const roiNorm = normalize(roi, -50, 200);
  const drawdownNorm = 100 - normalize(maxDrawdown, 0, 100);
  const activityNorm = normalize(
    metrics.tradeCount / Math.max(1, metrics.activityDays / 30),
    0,
    100
  );

  const trustScore = clamp(
    roiNorm * 0.3 + consistency * 0.25 + drawdownNorm * 0.25 + activityNorm * 0.2,
    0,
    100
  );

  let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
  if (maxDrawdown < 15 && consistency > 70) riskLevel = 'LOW';
  else if (maxDrawdown > 40 || consistency < 40) riskLevel = 'HIGH';

  return {
    trustScore: Math.round(trustScore * 100) / 100,
    roi,
    winRate,
    maxDrawdown,
    consistency,
    profitFactor,
    riskLevel,
  };
}
