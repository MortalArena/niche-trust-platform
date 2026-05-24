import type { PolymarketEvent, PolymarketMarket } from './types';

export interface ParsedOutcome {
  label: string;
  probability: number;
}

export interface ParsedMarketCard {
  id: string;
  eventSlug: string;
  question: string;
  imageUrl?: string;
  categoryLabel?: string;
  outcomes: ParsedOutcome[];
  volumeUsd?: number;
  volume24hrUsd?: number;
  endDate?: string;
  href: string;
}

function safeJsonArray(raw?: string): string[] | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as unknown;
    return Array.isArray(v) ? v.map(String) : null;
  } catch {
    return null;
  }
}

function parsePrices(market: PolymarketMarket): ParsedOutcome[] {
  const outcomes = safeJsonArray(market.outcomes) ?? ['Yes', 'No'];
  const priceRaw = safeJsonArray(market.outcomePrices);
  let prices: number[] = priceRaw
    ? priceRaw.map((p) => parseFloat(p))
    : [0.5, 0.5];

  const ext = market as {
    lastTradePrice?: number;
    bestBid?: number;
    bestAsk?: number;
  };

  // Gamma outcomePrices can be stale (0/1) while lastTradePrice is live
  const yesStale =
    prices[0] != null && (prices[0] <= 0.001 || prices[0] >= 0.999) && prices[0] + (prices[1] ?? 0) <= 1.001;
  if (yesStale && ext.lastTradePrice != null) {
    const yes = Number(ext.lastTradePrice);
    if (!Number.isNaN(yes) && yes >= 0 && yes <= 1) {
      prices = [yes, Math.max(0, Math.min(1, 1 - yes))];
    }
  } else if (prices.every((p) => Number.isNaN(p) || p === 0) && ext.bestBid != null && ext.bestAsk != null) {
    const mid = (Number(ext.bestBid) + Number(ext.bestAsk)) / 2;
    if (!Number.isNaN(mid)) prices = [mid, 1 - mid];
  }

  return outcomes.slice(0, 2).map((label, i) => ({
    label,
    probability: Math.round(Math.max(0, Math.min(100, (prices[i] ?? 0) * 100))),
  }));
}

function formatVolume(n?: number): number | undefined {
  if (n == null || Number.isNaN(n)) return undefined;
  return n;
}

export function eventToCards(ev: PolymarketEvent, siteBase: string): ParsedMarketCard[] {
  const markets = ev.markets ?? [];
  const tag = ev.tags?.[0]?.label;
  const imageUrl = (ev as { image?: string }).image ?? markets[0]?.icon;

  if (markets.length === 0) {
    return [
      {
        id: ev.id,
        eventSlug: ev.slug,
        question: ev.title ?? ev.slug,
        imageUrl,
        categoryLabel: tag,
        outcomes: [{ label: 'Yes', probability: 50 }],
        href: `${siteBase}/event/${ev.slug}`,
      },
    ];
  }

  return markets.slice(0, 1).map((m) => {
    const vol = formatVolume(
      Number((m as { volumeNum?: number }).volumeNum ?? (m as { volume?: string }).volume ?? 0)
    );
    const vol24 = formatVolume(
      Number((m as { volume24hr?: number }).volume24hr ?? 0)
    );

    return {
      id: m.id,
      eventSlug: ev.slug,
      question: m.question ?? ev.title ?? ev.slug,
      imageUrl: m.icon ?? imageUrl,
      categoryLabel: tag,
      outcomes: parsePrices(m),
      volumeUsd: vol,
      volume24hrUsd: vol24,
      endDate: (m as { endDate?: string }).endDate,
      href: `${siteBase}/event/${ev.slug}`,
    };
  });
}

export function formatVolumeDisplay(usd?: number): string {
  if (!usd || usd <= 0) return '—';
  if (usd >= 1_000_000) return `$${(usd / 1_000_000).toFixed(1)}M`;
  if (usd >= 1_000) return `$${(usd / 1_000).toFixed(0)}K`;
  return `$${usd.toFixed(0)}`;
}
