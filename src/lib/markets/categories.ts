/**
 * Marketplace categories aligned with Polymarket's navigation taxonomy.
 * Experts sell information/signals in parallel verticals.
 */

export interface MarketCategory {
  slug: string;
  name: string;
  description: string;
  icon: string;
  subcategories?: { slug: string; name: string }[];
}

export const MARKET_CATEGORIES: MarketCategory[] = [
  {
    slug: 'politics',
    name: 'Politics',
    description: 'Elections, policy, government outcomes',
    icon: '🏛️',
    subcategories: [
      { slug: 'us-elections', name: 'US Elections' },
      { slug: 'global-elections', name: 'Global Elections' },
      { slug: 'policy', name: 'Policy & Legislation' },
    ],
  },
  {
    slug: 'sports',
    name: 'Sports',
    description: 'NFL, NBA, soccer, MLB, NHL, and more',
    icon: '⚽',
    subcategories: [
      { slug: 'nfl', name: 'NFL' },
      { slug: 'nba', name: 'NBA' },
      { slug: 'soccer', name: 'Soccer' },
      { slug: 'mlb', name: 'MLB' },
      { slug: 'nhl', name: 'NHL' },
      { slug: 'mma', name: 'MMA / UFC' },
    ],
  },
  {
    slug: 'crypto',
    name: 'Crypto',
    description: 'BTC, ETH, DeFi, regulation, on-chain events',
    icon: '₿',
    subcategories: [
      { slug: 'btc', name: 'Bitcoin' },
      { slug: 'eth', name: 'Ethereum' },
      { slug: 'altcoins', name: 'Altcoins' },
      { slug: 'defi', name: 'DeFi' },
    ],
  },
  {
    slug: 'economics',
    name: 'Economics & Finance',
    description: 'Macro, Fed, CPI, rates, equities',
    icon: '📈',
    subcategories: [
      { slug: 'macro', name: 'Macro' },
      { slug: 'fed', name: 'Fed & Rates' },
      { slug: 'equities', name: 'Equities' },
    ],
  },
  {
    slug: 'geopolitics',
    name: 'Geopolitics',
    description: 'Conflicts, diplomacy, international relations',
    icon: '🌍',
  },
  {
    slug: 'science-tech',
    name: 'Science & Tech',
    description: 'AI, space, biotech, product launches',
    icon: '🔬',
    subcategories: [
      { slug: 'ai', name: 'AI' },
      { slug: 'space', name: 'Space' },
      { slug: 'biotech', name: 'Biotech' },
    ],
  },
  {
    slug: 'culture',
    name: 'Culture & Entertainment',
    description: 'Awards, box office, music, celebrities',
    icon: '🎬',
    subcategories: [
      { slug: 'awards', name: 'Awards Shows' },
      { slug: 'box-office', name: 'Box Office' },
      { slug: 'music', name: 'Music Charts' },
    ],
  },
  {
    slug: 'business',
    name: 'Business',
    description: 'Earnings, IPOs, corporate events',
    icon: '💼',
  },
  {
    slug: 'climate-weather',
    name: 'Climate & Weather',
    description: 'Weather events, climate milestones',
    icon: '🌤️',
  },
  {
    slug: 'esports',
    name: 'Esports',
    description: 'LoL, CS2, Valorant, and competitive gaming',
    icon: '🎮',
  },
  {
    slug: 'world-events',
    name: 'World Events',
    description: 'Breaking news and global developments',
    icon: '📰',
  },
];

export function getCategoryBySlug(slug: string): MarketCategory | undefined {
  return MARKET_CATEGORIES.find((c) => c.slug === slug);
}

export function getAllCategorySlugs(): string[] {
  return MARKET_CATEGORIES.map((c) => c.slug);
}
