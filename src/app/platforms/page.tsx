import Link from 'next/link';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';

const PLATFORMS = [
  {
    name: 'Polymarket',
    href: '/polymarket',
    color: 'emerald',
    desc: 'Real-money crypto prediction markets. Live Gamma API + expert wallet sync on Polygon.',
  },
  {
    name: 'Kalshi',
    href: '/platforms/kalshi',
    color: 'cyan',
    desc: 'US-regulated event contracts. Public market listings; portfolio needs user API keys.',
  },
  {
    name: 'Manifold',
    href: '/platforms/manifold',
    color: 'blue',
    desc: 'Play-money markets for reputation signals. Public bets API by username.',
  },
] as const;

export default function PlatformsPage() {
  return (
    <MarketplaceShell showCategoryNav={false}>
      <div className="max-w-3xl">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Prediction platforms</h1>
        <p className="mb-8 text-sm text-[var(--text-secondary)]">
          Browse integrated venues. Expert trust scores are chain-specific (Polygon for Polymarket).
        </p>
        <div className="space-y-4">
          {PLATFORMS.map((p) => (
            <Link
              key={p.name}
              href={p.href}
              className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 hover:border-blue-300 hover:shadow-md"
            >
              <h2 className="text-lg font-semibold text-blue-600">{p.name}</h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{p.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </MarketplaceShell>
  );
}
