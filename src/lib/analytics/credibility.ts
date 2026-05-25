import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';

// ─── Types ──────────────────────────────────────────────────────

export interface CredibilityScore {
  overall: number;
  predictionAccuracy?: number;
  accountAgeScore: number;
  retentionScore: number;
  consistencyScore: number;
  clarityScore: number;
  activityFreshness: number;
  diversityScore: number;
  maxConsecutiveLosses: number;
  sharpeRatioDisplay: number;
  badges: string[];
  trendMonths: { month: string; score: number }[];
}

// ─── Prediction Accuracy ────────────────────────────────────────

/**
 * Calculate prediction accuracy for a user:
 * resolvedWinCount / resolvedTotalCount * 100
 */
export async function calcPredictionAccuracy(userId: string): Promise<{
  accuracy: number;
  total: number;
  wins: number;
  losses: number;
}> {
  const resolved = await prisma.prediction.findMany({
    where: {
      authorId: userId,
      outcome: { in: ['WIN', 'LOSS'] },
    },
    select: { outcome: true },
  });

  const wins = resolved.filter((p) => p.outcome === 'WIN').length;
  const total = resolved.length;
  const accuracy = total > 0 ? (wins / total) * 100 : 0;

  return { accuracy, total, wins, losses: total - wins };
}

// ─── Account Age ────────────────────────────────────────────────

/**
 * Calculate account age in days and score (0-100).
 * Score = min(days / 365 * 100, 100)
 */
export async function calcAccountAge(userId: string): Promise<{
  accountAgeDays: number;
  walletAgeDays: number;
  score: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true, wallets: { select: { createdAt: true, transactions: { take: 1, orderBy: { blockTime: 'asc' as const }, select: { blockTime: true } } } } },
  });
  if (!user) return { accountAgeDays: 0, walletAgeDays: 0, score: 0 };

  const accountAgeDays = Math.floor((Date.now() - user.createdAt.getTime()) / 86400000);
  
  // Get oldest transaction across all wallets
  let walletAgeDays = 0;
  for (const wallet of user.wallets) {
    if (wallet.transactions.length > 0) {
      const oldestTx = wallet.transactions[0]!;
      const txDays = Math.floor((Date.now() - oldestTx.blockTime * 1000) / 86400000);
      if (txDays > walletAgeDays) walletAgeDays = txDays;
    }
  }

  const maxAge = Math.max(accountAgeDays, walletAgeDays);
  const score = Math.min((maxAge / 365) * 100, 100);

  return { accountAgeDays, walletAgeDays, score };
}

// ─── Subscriber Retention ───────────────────────────────────────

/**
 * Calculate subscriber retention rate.
 * Retention = renewedSubscriptions / totalExpiredSubscriptions * 100
 */
export async function calcRetentionRate(groupOwnerId: string): Promise<{
  retentionRate: number;
  totalExpired: number;
  renewed: number;
}> {
  const groups = await prisma.group.findMany({
    where: { ownerId: groupOwnerId },
    select: {
      subscriptions: {
        where: { status: { in: ['expired', 'active'] } },
        select: { status: true, userId: true, groupId: true },
      },
    },
  });

  let totalExpired = 0;
  let renewed = 0;
  const seen = new Set<string>();

  for (const group of groups) {
    for (const sub of group.subscriptions) {
      const key = `${sub.userId}-${sub.groupId}`;
      if (seen.has(key)) {
        if (sub.status === 'active') renewed++;
      } else {
        seen.add(key);
        if (sub.status === 'expired') totalExpired++;
        else if (sub.status === 'active') totalExpired++; // Count active as "has been subscribed"
      }
    }
  }

  const retentionRate = totalExpired > 0 ? (renewed / totalExpired) * 100 : 0;
  return { retentionRate, totalExpired, renewed };
}

// ─── Prediction Clarity Score ────────────────────────────────────

/**
 * Calculate prediction clarity based on field completeness.
 * 25% each for: entryPrice, targetPrice, stopLoss, timeframe
 */
export async function calcClarityScore(userId: string): Promise<{
  clarityScore: number;
  totalPredictions: number;
  withEntry: number;
  withTarget: number;
  withStopLoss: number;
  withTimeframe: number;
}> {
  const predictions = await prisma.prediction.findMany({
    where: { authorId: userId },
    select: { entryPrice: true, targetPrice: true, stopLoss: true, timeframe: true },
  });

  const total = predictions.length;
  if (total === 0) return { clarityScore: 0, totalPredictions: 0, withEntry: 0, withTarget: 0, withStopLoss: 0, withTimeframe: 0 };

  const withEntry = predictions.filter((p) => p.entryPrice).length;
  const withTarget = predictions.filter((p) => p.targetPrice).length;
  const withStopLoss = predictions.filter((p) => p.stopLoss).length;
  const withTimeframe = predictions.filter((p) => p.timeframe).length;

  const entryScore = (withEntry / total) * 25;
  const targetScore = (withTarget / total) * 25;
  const stopLossScore = (withStopLoss / total) * 25;
  const timeframeScore = (withTimeframe / total) * 25;

  return {
    clarityScore: Math.round(entryScore + targetScore + stopLossScore + timeframeScore),
    totalPredictions: total,
    withEntry,
    withTarget,
    withStopLoss,
    withTimeframe,
  };
}

// ─── Activity Freshness ─────────────────────────────────────────

export async function calcActivityFreshness(userId: string): Promise<{
  freshnessScore: number;
  daysSinceLastPrediction: number | null;
  daysSinceLastTrade: number | null;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      predictions: { take: 1, orderBy: { createdAt: 'desc' as const }, select: { createdAt: true } },
      wallets: { select: { transactions: { take: 1, orderBy: { blockTime: 'desc' as const }, select: { blockTime: true } } } },
    },
  });
  if (!user) return { freshnessScore: 0, daysSinceLastPrediction: null, daysSinceLastTrade: null };

  let daysSinceLastPrediction: number | null = null;
  if (user.predictions.length > 0) {
    daysSinceLastPrediction = Math.floor((Date.now() - user.predictions[0]!.createdAt.getTime()) / 86400000);
  }

  let daysSinceLastTrade: number | null = null;
  for (const wallet of user.wallets) {
    if (wallet.transactions.length > 0) {
      const txDays = Math.floor((Date.now() - wallet.transactions[0]!.blockTime * 1000) / 86400000);
      if (daysSinceLastTrade === null || txDays < daysSinceLastTrade!) daysSinceLastTrade = txDays;
    }
  }

  const maxDays = Math.min(daysSinceLastPrediction ?? 999, daysSinceLastTrade ?? 999);
  const freshnessScore = maxDays <= 1 ? 100 : maxDays <= 7 ? 80 : maxDays <= 30 ? 60 : maxDays <= 90 ? 40 : maxDays <= 365 ? 20 : 0;

  return { freshnessScore, daysSinceLastPrediction, daysSinceLastTrade };
}

// ─── Max Consecutive Losses ─────────────────────────────────────

export async function calcMaxConsecutiveLosses(userId: string): Promise<{
  maxConsecutiveLosses: number;
  currentStreak: number;
}> {
  const score = await prisma.traderScore.findUnique({
    where: { userId },
    select: { losingTrades: true, winningTrades: true },
  });

  // Approximate from win rate
  if (!score || score.winningTrades + score.losingTrades === 0) {
    return { maxConsecutiveLosses: 0, currentStreak: 0 };
  }

  // Estimate consecutive losses from losingTrades / win rate distribution
  const totalTrades = score.winningTrades + score.losingTrades;
  const winRate = score.winningTrades / totalTrades;
  const estimatedMaxLossStreak = Math.round(Math.log(totalTrades) / Math.log(1 / (1 - winRate + 0.01)));

  return {
    maxConsecutiveLosses: Math.max(1, estimatedMaxLossStreak),
    currentStreak: 0, // Requires real trade ordering
  };
}

// ─── Diversity Score ────────────────────────────────────────────

export async function calcDiversityScore(userId: string): Promise<{
  diversityScore: number;
  uniqueAssets: number;
  uniqueCategories: number;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      predictions: { select: { category: true, asset: true } },
      wallets: { select: { transactions: { select: { tokenIn: true, tokenOut: true } } } },
    },
  });
  if (!user) return { diversityScore: 0, uniqueAssets: 0, uniqueCategories: 0 };

  const categories = new Set(user.predictions.map((p) => p.category).filter(Boolean));
  const assets = new Set<string>();
  for (const p of user.predictions) if (p.asset) assets.add(p.asset);
  for (const w of user.wallets) for (const tx of w.transactions) {
    if (tx.tokenIn) assets.add(tx.tokenIn);
    if (tx.tokenOut) assets.add(tx.tokenOut);
  }

  const uniqueAssets = assets.size;
  const uniqueCategories = categories.size;
  const diversityScore = Math.min((uniqueCategories * 20 + Math.min(uniqueAssets, 10) * 5), 100);

  return { diversityScore, uniqueAssets, uniqueCategories };
}

// ─── Verification Badges ────────────────────────────────────────

export async function calcBadges(
  userId: string,
  scores: {
    trustScore: number;
    winRate: number;
    maxDrawdown: number;
    totalTrades: number;
    consistency: number;
  },
  extras: {
    accountAgeDays: number;
    predictionCount: number;
    isAnonymous: boolean;
    walletVerified: boolean;
    polymarketLinked: boolean;
  }
): Promise<string[]> {
  const badges: string[] = [];

  // Verified Wallet
  if (extras.walletVerified) badges.push('🟢 Verified Wallet');

  // Polymarket Connected
  if (extras.polymarketLinked) badges.push('🔵 Polymarket Connected');

  // Top 10% — trustScore > 80
  if (scores.trustScore >= 80) badges.push('🟡 Top 10%');

  // Consistent Performer — consistency > 70 and 3+ months
  if (scores.consistency > 70 && extras.accountAgeDays >= 90) badges.push('🟣 Consistent Performer');

  // Low Risk
  if (scores.maxDrawdown < 15 && scores.totalTrades >= 100) badges.push('🟠 Low Risk');

  // Veteran — account older than 1 year
  if (extras.accountAgeDays >= 365) badges.push('🔴 Veteran');

  // Anonymous
  if (extras.isAnonymous) badges.push('⚪ Anonymous');

  // 100+ Predictions
  if (extras.predictionCount >= 100) badges.push('🟤 100+ Predictions');

  return badges;
}

// ─── Combined Credibility Score ─────────────────────────────────

/**
 * Compute full credibility for a user.
 * Runs ALL checks and returns a unified score + badges.
 */
export async function computeFullCredibility(userId: string): Promise<CredibilityScore> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      isAnonymous: true,
      createdAt: true,
      predictions: { select: { id: true } },
      scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' as const } },
      wallets: { select: { id: true } },
      ownedGroups: { select: { id: true } },
    },
  });
  if (!user) throw new Error('User not found');

  const score = user.scores[0];
  const trustScore = score ? Number(score.trustScore) : 0;
  const winRate = score ? Number(score.winRate) : 0;
  const maxDrawdown = score ? Number(score.maxDrawdown) : 0;
  const totalTrades = score ? score.totalTrades : 0;
  const consistency = score ? Number(score.consistency) : 0;
  const predictionCount = user.predictions.length;

  // Run all checks in parallel
  const [predAccuracy, accountAge, retention, clarity, freshness, consecLosses, diversity] =
    await Promise.all([
      calcPredictionAccuracy(userId),
      calcAccountAge(userId),
      calcRetentionRate(userId),
      calcClarityScore(userId),
      calcActivityFreshness(userId),
      calcMaxConsecutiveLosses(userId),
      calcDiversityScore(userId),
    ]);

  const badges = await calcBadges(
    userId,
    { trustScore, winRate, maxDrawdown, totalTrades, consistency },
    {
      accountAgeDays: accountAge.accountAgeDays,
      predictionCount,
      isAnonymous: user.isAnonymous,
      walletVerified: user.wallets.length > 0,
      polymarketLinked: user.predictions.some((p) => p.id !== ''),
    }
  );

  // Compute overall credibility score (weighted average)
  const hasAllData =
    predAccuracy.total > 0 &&
    accountAge.accountAgeDays > 0 &&
    totalTrades > 0;

  const overall = hasAllData
    ? Math.round(
        trustScore * 0.25 +
        (predAccuracy.accuracy || 50) * 0.15 +
        accountAge.score * 0.10 +
        retention.retentionRate * 0.10 +
        consistency * 0.10 +
        clarity.clarityScore * 0.05 +
        freshness.freshnessScore * 0.10 +
        diversity.diversityScore * 0.05 +
        (consecLosses.maxConsecutiveLosses < 5 ? 100 : consecLosses.maxConsecutiveLosses < 10 ? 60 : 30) * 0.05 +
        (badges.length / 8) * 100 * 0.05
      )
    : trustScore; // Fallback to TrustScore if insufficient data

  return {
    overall,
    predictionAccuracy: predAccuracy.total > 0 ? predAccuracy.accuracy : undefined,
    accountAgeScore: accountAge.score,
    retentionScore: retention.retentionRate,
    consistencyScore: consistency,
    clarityScore: clarity.clarityScore,
    activityFreshness: freshness.freshnessScore,
    diversityScore: diversity.diversityScore,
    maxConsecutiveLosses: consecLosses.maxConsecutiveLosses,
    sharpeRatioDisplay: score ? Number(score.sharpeRatio) : 0,
    badges,
    trendMonths: [],
  };
}