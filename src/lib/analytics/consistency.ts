import { mean, standardDeviation } from 'simple-statistics';

export function calculateConsistency(monthlyReturns: number[]): number {
  if (monthlyReturns.length < 2) return 50;

  const avg = mean(monthlyReturns);
  const std = standardDeviation(monthlyReturns);
  if (avg === 0) return 0;

  const cv = Math.abs(std / avg);
  return Math.max(0, Math.min(100, 100 - cv * 100));
}
