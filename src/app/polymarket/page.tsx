import { Suspense } from 'react';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { EventsBrowser } from '@/components/marketplace/events-browser';
import { GlobalSearch } from '@/components/marketplace/global-search';
import { listEvents } from '@/lib/polymarket/gamma';
import { withFetchTimeout } from '@/lib/fetch-timeout';

/** Refresh market list every 15 minutes */
export const revalidate = 900;

export default async function PolymarketLivePage() {
  let events: Awaited<ReturnType<typeof listEvents>> = [];
  let error: string | null = null;

  try {
    events = await withFetchTimeout(
      listEvents({ limit: 24, active: true, closed: false }),
      10_000,
      'Polymarket events'
    );
  } catch (e) {
    error = e instanceof Error ? e.message : 'Could not reach Polymarket Gamma API';
  }

  return (
    <MarketplaceShell basePath="/polymarket">
      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="mb-6 max-w-xl">
        <Suspense fallback={null}>
          <GlobalSearch size="large" />
        </Suspense>
      </div>

      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Live events from{' '}
        <code className="rounded bg-[var(--surface-hover)] px-1 text-blue-600">
          gamma-api.polymarket.com
        </code>
        . Experts on Niche Trust sell private signals in parallel categories.
      </p>

      <Suspense fallback={<div className="py-20 text-center text-[var(--text-muted)]">Loading markets…</div>}>
        <EventsBrowser initialEvents={events} />
      </Suspense>
    </MarketplaceShell>
  );
}
