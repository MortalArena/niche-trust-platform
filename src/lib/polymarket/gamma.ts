import { GAMMA, POLYMARKET } from '@/lib/polymarket/config';
import { gammaFetch } from '@/lib/polymarket/client';
import type { PolymarketEvent, PolymarketMarket, PolymarketTag } from '@/lib/polymarket/types';

export async function listTags(limit = 100): Promise<PolymarketTag[]> {
  return gammaFetch<PolymarketTag[]>(GAMMA.tags, { limit });
}

export async function getEventBySlug(slug: string): Promise<PolymarketEvent | null> {
  const events = await gammaFetch<PolymarketEvent[]>(GAMMA.events, {
    slug,
    active: true,
    closed: false,
  });
  return events[0] ?? null;
}

export async function listEvents(params?: {
  limit?: number;
  tag_slug?: string;
  tag_id?: string;
  active?: boolean;
  closed?: boolean;
  /** Gamma sort — e.g. volume24hr for trending */
  order?: string;
  ascending?: boolean;
}): Promise<PolymarketEvent[]> {
  return gammaFetch<PolymarketEvent[]>(GAMMA.events, {
    limit: params?.limit ?? 20,
    tag_slug: params?.tag_slug,
    tag_id: params?.tag_id,
    active: params?.active ?? true,
    closed: params?.closed ?? false,
    order: params?.order,
    ascending: params?.ascending,
  });
}

export async function searchPublic(query: string, limit = 20): Promise<PolymarketEvent[]> {
  const trimmed = query.trim();
  if (!trimmed) return [];

  try {
    const data = await gammaFetch<{ events?: PolymarketEvent[] }>(GAMMA.search, {
      q: trimmed,
      limit,
      events_status: 'active',
    });
    if (data.events?.length) return data.events;
  } catch {
    /* fallback below */
  }

  const events = await listEvents({ limit: 50, active: true, closed: false });
  const q = trimmed.toLowerCase();
  return events
    .filter(
      (e) =>
        e.title?.toLowerCase().includes(q) ||
        e.slug?.toLowerCase().includes(q) ||
        e.markets?.some((m) => m.question?.toLowerCase().includes(q))
    )
    .slice(0, limit);
}

export async function listMarkets(params?: {
  limit?: number;
  tag_id?: string;
  active?: boolean;
}): Promise<PolymarketMarket[]> {
  return gammaFetch<PolymarketMarket[]>(GAMMA.markets, {
    limit: params?.limit ?? 20,
    tag_id: params?.tag_id,
    active: params?.active ?? true,
    closed: false,
  });
}

export function polymarketEventUrl(slug: string): string {
  return `${POLYMARKET.site}/event/${slug}`;
}
