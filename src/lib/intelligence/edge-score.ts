/**
 * Composite Edge Score — reputation formula for Polymarket wallets.
 * 40% ROI · 25% Consistency · 15% Risk · 10% Timing · 10% Volume activity
 */

export interface EdgeScoreInput {
  roi: number;
  consistency: number;
  maxDrawdown: number;
  timingScore: number;
  tradesPerMonth: number;
}

function norm(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
}

export function calculateEdgeScore(input: EdgeScoreInput): number {
  const roiNorm = norm(input.roi, -30, 150);
  const consistencyNorm = Math.min(100, Math.max(0, input.consistency));
  const riskNorm = 100 - norm(input.maxDrawdown, 0, 80);
  const timingNorm = Math.min(100, Math.max(0, input.timingScore));
  const volumeNorm = norm(input.tradesPerMonth, 0, 80);

  const edge =
    roiNorm * 0.4 +
    consistencyNorm * 0.25 +
    riskNorm * 0.15 +
    timingNorm * 0.1 +
    volumeNorm * 0.1;

  return Math.round(edge * 100) / 100;
}

export const RANKING_BOARDS = [
  'top_edge',
  'highest_roi_30d',
  'best_win_rate',
  'most_consistent',
  'smart_money_volume',
] as const;

export type RankingBoardId = (typeof RANKING_BOARDS)[number];

export const RANKING_BOARD_LABELS: Record<RankingBoardId, { label: string; description: string }> = {
  top_edge: {
    label: 'Edge Score',
    description: 'Composite reputation: ROI, consistency, risk, timing, volume',
  },
  highest_roi_30d: {
    label: 'Highest ROI',
    description: 'Best return on resolved positions',
  },
  best_win_rate: {
    label: 'Win Rate',
    description: 'Highest win % (min. 20 trades)',
  },
  most_consistent: {
    label: 'Most Consistent',
    description: 'Stable month-over-month performance',
  },
  smart_money_volume: {
    label: 'Smart Money',
    description: 'Highest notional volume traded',
  },
};
