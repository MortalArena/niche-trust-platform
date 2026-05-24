export interface KalshiEventCard {
  ticker: string;
  title: string;
  subtitle?: string;
  category?: string;
  url: string;
}

export interface KalshiLeg {
  side: 'yes' | 'no' | string;
  label: string;
}

export function kalshiEventToCard(event: {
  event_ticker?: string;
  series_ticker?: string;
  title?: string;
  sub_title?: string;
  category?: string;
}): KalshiEventCard {
  const series = event.series_ticker ?? event.event_ticker ?? '';
  const ticker = event.event_ticker ?? series;
  return {
    ticker,
    title: event.title ?? ticker,
    subtitle: event.sub_title,
    category: event.category,
    url: series
      ? `https://kalshi.com/markets/${series.toLowerCase().replace(/_/g, '-')}`
      : 'https://kalshi.com',
  };
}

/** Parse combo-market title into readable legs */
export function parseKalshiComboTitle(title: string): KalshiLeg[] {
  if (!title?.trim()) return [];
  return title.split(',').map((part) => {
    const trimmed = part.trim();
    const m = trimmed.match(/^(yes|no)\s+(.+)$/i);
    if (m) return { side: m[1].toLowerCase(), label: m[2] };
    return { side: '', label: trimmed };
  });
}

export function formatKalshiPrice(dollars?: string | null): string {
  if (!dollars) return '—';
  const n = Number(dollars);
  if (Number.isNaN(n)) return dollars;
  return `${(n * 100).toFixed(1)}¢`;
}
