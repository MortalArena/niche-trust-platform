'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { tagSlugForNav } from '@/lib/markets/navigation';
import { eventToCards, type ParsedMarketCard } from '@/lib/polymarket/parse-market';
import { POLYMARKET } from '@/lib/polymarket/config';
import type { PolymarketEvent } from '@/lib/polymarket/types';
import { MarketCard } from './market-card';
import { MarketsToolbar, type MarketFilters } from './markets-toolbar';

export function EventsBrowser({ initialEvents }: { initialEvents: PolymarketEvent[] }) {
  const { t } = useApp();
  const searchParams = useSearchParams();
  const cat = searchParams.get('cat') ?? 'trending';
  const qParam = searchParams.get('q') ?? '';
  const q = qParam.toLowerCase();

  const [events, setEvents] = useState(initialEvents);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState<MarketFilters>({
    hideSports: false,
    hideCrypto: false,
    hideEarnings: false,
    sort: 'volume',
  });

  useEffect(() => {
    if (qParam.length >= 2) {
      setLoading(true);
      fetch(`/api/search?q=${encodeURIComponent(qParam)}`)
        .then((r) => r.json())
        .then((d: { markets?: { slug: string; title: string }[] }) => {
          const mapped = (d.markets ?? []).map((m) => ({
            id: m.slug,
            slug: m.slug,
            title: m.title,
            markets: [],
          })) as PolymarketEvent[];
          setEvents(mapped);
        })
        .finally(() => setLoading(false));
      return;
    }

    const tag = tagSlugForNav(cat);
    if (!tag && cat === 'trending') {
      setEvents(initialEvents);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ limit: '24' });
        if (tag) params.set('tag_slug', tag);
        const res = await fetch(`/api/polymarket/events?${params}`);
        const data = await res.json();
        if (data.events) setEvents(data.events);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [cat, qParam, initialEvents]);

  const cards = useMemo(() => {
    let list: ParsedMarketCard[] = events.flatMap((ev) => eventToCards(ev, POLYMARKET.site));

    if (q) {
      list = list.filter(
        (c) =>
          c.question.toLowerCase().includes(q) ||
          c.categoryLabel?.toLowerCase().includes(q)
      );
    }

    if (filters.hideSports) {
      list = list.filter(
        (c) => !/nfl|nba|mlb|nhl|soccer|sports|ufc/i.test(c.question + (c.categoryLabel ?? ''))
      );
    }
    if (filters.hideCrypto) {
      list = list.filter(
        (c) => !/crypto|bitcoin|btc|eth|solana/i.test(c.question + (c.categoryLabel ?? ''))
      );
    }
    if (filters.hideEarnings) {
      list = list.filter((c) => !/earnings|ipo/i.test(c.question));
    }

    if (filters.sort === 'volume') {
      list.sort((a, b) => (b.volume24hrUsd ?? b.volumeUsd ?? 0) - (a.volume24hrUsd ?? a.volumeUsd ?? 0));
    }

    return list;
  }, [events, q, filters]);

  return (
    <div>
      <MarketsToolbar
        title={t.markets.allMarkets}
        filters={filters}
        onChange={setFilters}
      />

      {loading && (
        <p className="mb-4 text-sm text-[var(--text-muted)]">Loading…</p>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((card) => (
          <MarketCard key={card.id} card={card} />
        ))}
      </div>

      {cards.length === 0 && !loading && (
        <p className="py-12 text-center text-[var(--text-muted)]">No markets match your filters.</p>
      )}
    </div>
  );
}
