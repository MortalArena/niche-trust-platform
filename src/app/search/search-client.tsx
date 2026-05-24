'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { GlobalSearch } from '@/components/marketplace/global-search';

interface SearchResult {
  query: string;
  markets: { id: string; slug: string; title: string; href: string }[];
  groups: { id: string; name: string; description: string | null; href: string; priceUsd: number }[];
  experts: { displayName: string | null; trustScore: number; href: string }[];
}

export function SearchPageClient() {
  const searchParams = useSearchParams();
  const q = searchParams.get('q') ?? '';
  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (q.length < 2) {
      setData(null);
      return;
    }
    setLoading(true);
    fetch(`/api/search?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, [q]);

  const total =
    (data?.markets.length ?? 0) + (data?.groups.length ?? 0) + (data?.experts.length ?? 0);

  return (
    <MarketplaceShell showCategoryNav={false}>
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">Search</h1>
        <GlobalSearch size="large" defaultQuery={q} className="mb-8" />

        {q.length < 2 && (
          <p className="text-[var(--text-secondary)]">
            Type at least 2 characters to search Polymarket events, expert groups, and traders.
          </p>
        )}

        {loading && <p className="text-[var(--text-muted)]">Searching…</p>}

        {data && q.length >= 2 && !loading && (
          <>
            <p className="mb-6 text-sm text-[var(--text-secondary)]">
              {total} result{total === 1 ? '' : 's'} for &quot;{data.query}&quot;
            </p>

            {data.markets.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Polymarket events</h2>
                <ul className="space-y-2">
                  {data.markets.map((m) => (
                    <li key={m.id}>
                      <a
                        href={m.href}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] hover:border-blue-400"
                      >
                        {m.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.groups.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Expert groups</h2>
                <ul className="space-y-2">
                  {data.groups.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={g.href}
                        className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-blue-400"
                      >
                        <span className="font-medium text-[var(--text-primary)]">{g.name}</span>
                        <span className="ml-2 text-sm text-blue-600">${g.priceUsd}/mo</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {data.experts.length > 0 && (
              <section className="mb-8">
                <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">Experts</h2>
                <ul className="space-y-2">
                  {data.experts.map((e, i) => (
                    <li key={i}>
                      <Link
                        href={e.href}
                        className="block rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-blue-400"
                      >
                        <span className="font-medium text-[var(--text-primary)]">
                          {e.displayName ?? 'Expert'}
                        </span>
                        <span className="ml-2 text-sm text-blue-600">
                          Trust {e.trustScore.toFixed(1)}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {total === 0 && (
              <p className="text-[var(--text-secondary)]">No results. Try another keyword.</p>
            )}
          </>
        )}
      </div>
    </MarketplaceShell>
  );
}
