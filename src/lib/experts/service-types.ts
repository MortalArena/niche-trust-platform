export const EXPERT_SERVICE_TYPES = [
  { slug: 'signals', name: 'Signals', icon: '📡', description: 'Trade alerts and entry/exit calls' },
  { slug: 'private-groups', name: 'Private groups', icon: '🔒', description: 'Paid encrypted communities' },
  { slug: 'trading-alpha', name: 'Trading alpha', icon: '⚡', description: 'Actionable edge and setups' },
  { slug: 'insider-research', name: 'Insider research', icon: '🔍', description: 'Deep dives and due diligence' },
  { slug: 'whale-tracking', name: 'Whale tracking', icon: '🐋', description: 'Large wallet and flow monitoring' },
  { slug: 'prediction-markets', name: 'Prediction markets', icon: '📊', description: 'Polymarket/Kalshi positioning' },
  { slug: 'quant-communities', name: 'Quant communities', icon: '🧮', description: 'Models, data, and systematic ideas' },
  { slug: 'copy-trading', name: 'Copy trading', icon: '👥', description: 'Mirror expert wallets or strategies' },
] as const;

export type ExpertServiceSlug = (typeof EXPERT_SERVICE_TYPES)[number]['slug'];

export function getServiceType(slug: string) {
  return EXPERT_SERVICE_TYPES.find((s) => s.slug === slug);
}

export function validateServiceTypes(slugs: string[]): ExpertServiceSlug[] {
  const allowed = new Set(EXPERT_SERVICE_TYPES.map((s) => s.slug));
  return slugs.filter((s): s is ExpertServiceSlug => allowed.has(s as ExpertServiceSlug));
}
