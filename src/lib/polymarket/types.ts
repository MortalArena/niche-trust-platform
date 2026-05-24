/** Gamma API — event contains one or more markets (docs: concepts/markets-events) */
export interface PolymarketEvent {
  id: string;
  slug: string;
  title: string;
  description?: string;
  active?: boolean;
  closed?: boolean;
  image?: string;
  volume?: number;
  volume24hr?: number;
  markets?: PolymarketMarket[];
  tags?: { slug: string; label: string }[];
}

export interface PolymarketMarket {
  id: string;
  slug?: string;
  question: string;
  conditionId: string;
  outcomes?: string;
  outcomePrices?: string;
  enableOrderBook?: boolean;
  clobTokenIds?: string;
  icon?: string;
  volume?: string | number;
  volumeNum?: number;
  volume24hr?: number;
  liquidity?: number;
  endDate?: string;
  groupItemTitle?: string;
}

export interface PolymarketTag {
  id: string;
  label: string;
  slug: string;
}

export interface PolymarketPublicProfile {
  proxyWallet?: string | null;
  name?: string | null;
  pseudonym?: string | null;
  bio?: string | null;
  profileImage?: string | null;
  xUsername?: string | null;
  verifiedBadge?: boolean | null;
}

/** Data API trade (docs: core/get-trades-for-a-user-or-markets) */
export interface PolymarketTrade {
  proxyWallet: string;
  side: 'BUY' | 'SELL';
  asset: string;
  conditionId: string;
  size: number;
  price: number;
  timestamp: number;
  title?: string;
  slug?: string;
  eventSlug?: string;
  outcome?: string;
  transactionHash?: string;
}

export interface PolymarketPosition {
  proxyWallet: string;
  conditionId: string;
  size?: number;
  avgPrice?: number;
  curPrice?: number;
  cashPnl?: number;
  realizedPnl?: number;
  title?: string;
  slug?: string;
  outcome?: string;
}

export interface PolymarketActivity {
  type?: string;
  timestamp?: number;
  conditionId?: string;
  title?: string;
  side?: string;
  size?: number;
  usdcSize?: number;
}
