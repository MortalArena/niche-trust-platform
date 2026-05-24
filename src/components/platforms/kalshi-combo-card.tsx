import { formatKalshiPrice, parseKalshiComboTitle } from '@/lib/kalshi/parse';

export function KalshiComboCard({
  ticker,
  title,
  yesAsk,
  category,
}: {
  ticker?: string;
  title?: string;
  yesAsk?: string | null;
  category?: string;
}) {
  const legs = parseKalshiComboTitle(title ?? '');

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Parlay / combo
        </span>
        {yesAsk != null && (
          <span className="text-sm font-semibold text-emerald-600">
            Yes ask {formatKalshiPrice(yesAsk)}
          </span>
        )}
      </div>
      {category && <p className="mb-2 text-xs text-[var(--text-muted)]">{category}</p>}
      <ul className="space-y-2">
        {legs.map((leg, i) => (
          <li
            key={`${ticker}-${i}`}
            className="flex items-start gap-2 rounded-lg bg-[var(--surface-hover)] px-3 py-2 text-sm"
          >
            {leg.side && (
              <span
                className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-bold uppercase ${
                  leg.side === 'yes'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {leg.side}
              </span>
            )}
            <span className="text-[var(--text-primary)]">{leg.label}</span>
          </li>
        ))}
      </ul>
      {ticker && (
        <p className="mt-3 truncate text-xs text-[var(--text-muted)]" title={ticker}>
          {ticker}
        </p>
      )}
    </div>
  );
}
