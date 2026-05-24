import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { KalshiEventCardView } from '@/components/platforms/kalshi-event-card';
import { KalshiComboCard } from '@/components/platforms/kalshi-combo-card';
import { listKalshiEvents, listKalshiMarkets } from '@/lib/kalshi/client';
import { kalshiEventToCard } from '@/lib/kalshi/parse';
import { withFetchTimeout } from '@/lib/fetch-timeout';

export const dynamic = 'force-dynamic';

export default async function KalshiPage() {
  let events: ReturnType<typeof kalshiEventToCard>[] = [];
  let combos: {
    ticker?: string;
    title?: string;
    yes_ask_dollars?: string;
    category?: string;
  }[] = [];
  let error: string | null = null;

  try {
    const [eventsData, marketsData] = await Promise.all([
      withFetchTimeout(listKalshiEvents(20, 'open'), 10_000, 'Kalshi events'),
      withFetchTimeout(listKalshiMarkets(8, 'open'), 10_000, 'Kalshi markets'),
    ]);

    const rawEvents = (eventsData as { events?: unknown[] }).events ?? [];
    events = rawEvents.map((e) => kalshiEventToCard(e as Parameters<typeof kalshiEventToCard>[0]));

    const rawMarkets = (marketsData as { markets?: typeof combos }).markets ?? [];
    combos = rawMarkets.filter((m) => (m as { mve_selected_legs?: unknown[] }).mve_selected_legs?.length);
  } catch (e) {
    error = e instanceof Error ? e.message : 'Kalshi API error';
  }

  return (
    <PageShell showCategoryNav={false}>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Kalshi markets</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Regulated US prediction markets. Events are shown with clear titles; combo/parlay markets are
        broken into readable legs below.
      </p>

      {error && (
        <p className="mb-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>
      )}

      {events.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Featured events</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {events.map((ev) => (
              <KalshiEventCardView key={ev.ticker} event={ev} />
            ))}
          </div>
        </section>
      )}

      {combos.length > 0 && (
        <section>
          <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Active parlays</h2>
          <p className="mb-4 text-sm text-[var(--text-secondary)]">
            Multi-leg markets split into individual outcomes for easier reading.
          </p>
          <div className="grid gap-4 lg:grid-cols-2">
            {combos.map((m) => (
              <KalshiComboCard
                key={m.ticker}
                ticker={m.ticker}
                title={m.title}
                yesAsk={m.yes_ask_dollars}
                category={m.category}
              />
            ))}
          </div>
        </section>
      )}

      {events.length === 0 && combos.length === 0 && !error && (
        <p className="rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">
          No open Kalshi markets right now.
        </p>
      )}

      <Link href="/platforms" className="mt-8 inline-block text-sm font-medium text-blue-600 hover:underline">
        ← Platforms
      </Link>
    </PageShell>
  );
}
