import Link from 'next/link';

const FOOTER = {
  product: [
    { href: '/markets', label: 'Markets' },
    { href: '/polymarket', label: 'Polymarket live' },
    { href: '/platforms', label: 'Platforms' },
    { href: '/groups', label: 'Expert groups' },
    { href: '/experts', label: 'Leaderboard' },
    { href: '/search', label: 'Search' },
  ],
  learn: [
    { href: '/learn', label: 'Documentation' },
    { href: '/learn/quickstart', label: 'Quickstart' },
    { href: '/learn/api-reference', label: 'APIs' },
    { href: '/learn/encrypted-chat', label: 'Encrypted chat' },
    { href: '/learn/wallet-trust', label: 'Trust & accuracy' },
  ],
  support: [
    { href: '/learn/quickstart', label: 'Help center' },
    { href: '/connect', label: 'Contact / sign in' },
    { href: '/learn/documentation-scope', label: 'What we document' },
  ],
  legal: [
    { href: '/learn', label: 'Terms (see docs)' },
    { href: 'https://docs.polymarket.com/', label: 'Polymarket docs ↗', external: true },
  ],
} as const;

export function MarketplaceFooter() {
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-7xl px-4 py-12">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="mb-3 flex items-center gap-2 font-bold text-[var(--text-primary)]">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm text-white">
                NT
              </span>
              Niche Trust
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              Expert marketplace for prediction traders. Live market data from Polymarket, Kalshi, and
              Manifold — private signals stay on Niche Trust.
            </p>
          </div>

          <FooterCol title="Product" links={FOOTER.product} />
          <FooterCol title="Learn" links={FOOTER.learn} />
          <FooterCol title="Support" links={FOOTER.support} />
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--border)] pt-6 text-xs text-[var(--text-muted)]">
          <span>© {new Date().getFullYear()} Niche Trust. Market odds via third-party APIs.</span>
          <div className="flex flex-wrap gap-4">
            {FOOTER.legal.map((l) =>
              'external' in l && l.external ? (
                <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="hover:text-blue-600">
                  {l.label}
                </a>
              ) : (
                <Link key={l.href} href={l.href} className="hover:text-blue-600">
                  {l.label}
                </Link>
              )
            )}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: readonly { href: string; label: string; external?: boolean }[];
}) {
  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">{title}</p>
      <ul className="space-y-2 text-sm">
        {links.map((l) => (
          <li key={l.href}>
            {'external' in l && l.external ? (
              <a href={l.href} target="_blank" rel="noreferrer" className="text-[var(--text-secondary)] hover:text-blue-600">
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="text-[var(--text-secondary)] hover:text-blue-600">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
