export interface LearnNavItem {
  title: string;
  href: string;
  slug: string;
}

export interface LearnNavSection {
  title: string;
  items: LearnNavItem[];
}

export const LEARN_NAV: LearnNavSection[] = [
  {
    title: 'Getting started',
    items: [
      { slug: '', title: 'Overview', href: '/learn' },
      { slug: 'quickstart', title: 'Quickstart', href: '/learn/quickstart' },
      { slug: 'documentation-scope', title: 'What we document', href: '/learn/documentation-scope' },
      { slug: 'platform-overview', title: 'Platform overview', href: '/learn/platform-overview' },
      { slug: 'intelligence-engine', title: 'Intelligence engine', href: '/learn/intelligence-engine' },
    ],
  },
  {
    title: 'Core product',
    items: [
      { slug: 'wallet-trust', title: 'Wallet trust scores', href: '/learn/wallet-trust' },
      { slug: 'expert-groups', title: 'Expert groups', href: '/learn/expert-groups' },
      { slug: 'encrypted-chat', title: 'Encrypted chat', href: '/learn/encrypted-chat' },
      { slug: 'payments', title: 'Payments & commission', href: '/learn/payments' },
    ],
  },
  {
    title: 'API & integrations',
    items: [
      { slug: 'authentication', title: 'Authentication', href: '/learn/authentication' },
      { slug: 'agent-api', title: 'Agent REST API', href: '/learn/agent-api' },
      { slug: 'polymarket-data', title: 'Polymarket data (read-only)', href: '/learn/polymarket-data' },
      { slug: 'mcp', title: 'MCP (optional)', href: '/learn/mcp' },
      { slug: 'skills', title: 'Agent skills (optional)', href: '/learn/skills' },
      { slug: 'external-platforms', title: 'Kalshi & Manifold', href: '/learn/external-platforms' },
    ],
  },
  {
    title: 'Reference',
    items: [
      { slug: 'api-reference', title: 'API reference', href: '/learn/api-reference' },
      { slug: 'environment', title: 'Environment variables', href: '/learn/environment' },
    ],
  },
];

export function slugFromPath(segments?: string[]): string {
  if (!segments?.length) return '';
  return segments.join('/');
}

export function findNavItem(slug: string): LearnNavItem | undefined {
  for (const section of LEARN_NAV) {
    const item = section.items.find((i) => i.slug === slug);
    if (item) return item;
  }
  return undefined;
}
