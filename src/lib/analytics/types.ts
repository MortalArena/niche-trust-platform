export interface TradeRecord {
  pnl: number;
  entryPrice: number;
  exitPrice: number;
  size: number;
  entryTime: number;
  exitTime: number;
}

export interface TraderMetrics {
  trades: TradeRecord[];
  monthlyReturns: number[];
  equityCurve: number[];
  tradeCount: number;
  activityDays: number;
}

export interface TrustScoreResult {
  trustScore: number;
  roi: number;
  winRate: number;
  maxDrawdown: number;
  consistency: number;
  profitFactor: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}
