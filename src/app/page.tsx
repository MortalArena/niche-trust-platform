import Link from 'next/link';
import { Suspense } from 'react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { GlobalSearch } from '@/components/marketplace/global-search';
import { HomeQuickNav } from '@/components/marketplace/home-quick-nav';
import { HomeDataSources } from '@/components/marketplace/home-data-sources';
import { getServerI18n } from '@/lib/i18n/server';
import { listEvents } from '@/lib/polymarket/gamma';
import { withFetchTimeout } from '@/lib/fetch-timeout';
import { eventToCards } from '@/lib/polymarket/parse-market';
import { POLYMARKET } from '@/lib/polymarket/config';
import { MarketCard } from '@/components/marketplace/market-card';

/** Re-fetch trending Polymarket data every 15 minutes (ISR) */
export const revalidate = 900;

export default async function HomePage() {
  const { messages: t } = await getServerI18n();
  const refreshedAt = new Date();

  let featured: ReturnType<typeof eventToCards> = [];
  try {
    const events = await withFetchTimeout(
      listEvents({
        limit: 12,
        active: true,
        closed: false,
        order: 'volume24hr',
        ascending: false,
      }),
      8000,
      'Polymarket trending'
    );
    featured = events
      .flatMap((ev) => eventToCards(ev, POLYMARKET.site))
      .filter((c) => (c.volume24hrUsd ?? c.volumeUsd ?? 0) > 0)
      .slice(0, 4);
  } catch {
    featured = [];
  }

  return (
    <MarketplaceShell>
      <section className="mb-8 text-center">
        <h1 className="mx-auto max-w-3xl text-3xl font-bold tracking-tight text-[var(--text-primary)] md:text-4xl">
          {t.home.title}
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-lg text-[var(--text-secondary)]">{t.home.subtitle}</p>
      </section>

      <section className="mx-auto mb-10 max-w-2xl">
        <Suspense fallback={null}>
          <GlobalSearch size="large" />
        </Suspense>
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          Search Polymarket, Kalshi browse, expert groups, and traders · Press{' '}
          <kbd className="rounded border border-[var(--border)] px-1">/</kbd> to focus
        </p>
      </section>

      <HomeDataSources refreshedAt={refreshedAt} />
      <HomeQuickNav />

      <div className="mb-10 flex flex-wrap justify-center gap-4">
        <Link
          href="/connect"
          className="rounded-lg bg-blue-600 px-8 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {t.home.cta}
        </Link>
        <Link
          href="/polymarket"
          className="rounded-lg border border-[var(--border)] px-8 py-3 font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          {t.home.browse}
        </Link>
      </div>

      {featured.length > 0 && (
        <section>
          <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.nav.trending}</h2>
            <Link href="/polymarket" className="text-sm font-medium text-blue-600 hover:underline">
              {t.nav.more} →
            </Link>
          </div>
          <p className="mb-4 text-xs text-[var(--text-muted)]">
            Live from Polymarket Gamma · sorted by 24h volume · auto-refresh ~15 min
          </p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {featured.map((card) => (
              <MarketCard key={card.id} card={card} />
            ))}
          </div>
        </section>
      )}
    </MarketplaceShell>
  );
}
