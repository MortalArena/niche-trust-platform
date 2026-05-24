'use client';

import { useApp } from '@/components/providers/app-provider';

export interface MarketFilters {
  hideSports: boolean;
  hideCrypto: boolean;
  hideEarnings: boolean;
  sort: 'volume' | 'new';
}

interface MarketsToolbarProps {
  filters: MarketFilters;
  onChange: (next: MarketFilters) => void;
  title: string;
}

export function MarketsToolbar({ filters, onChange, title }: MarketsToolbarProps) {
  const { t } = useApp();

  return (
    <div className="mb-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-[var(--text-primary)]">{title}</h1>
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg p-2 hover:bg-[var(--surface-hover)]" aria-label="Search">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          <button type="button" className="rounded-lg border border-[var(--border)] p-2 hover:bg-[var(--surface-hover)]" aria-label="Filters">
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as MarketFilters['sort'] })
          }
          className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]"
        >
          <option value="volume">{t.markets.volume24h}</option>
          <option value="new">{t.nav.new}</option>
        </select>

        <select className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]">
          <option>{t.markets.sortAll}</option>
        </select>

        <select className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm text-[var(--text-primary)]">
          <option>{t.markets.sortActive}</option>
        </select>

        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={filters.hideSports}
            onChange={(e) => onChange({ ...filters, hideSports: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          {t.markets.hideSports}
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={filters.hideCrypto}
            onChange={(e) => onChange({ ...filters, hideCrypto: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          {t.markets.hideCrypto}
        </label>
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={filters.hideEarnings}
            onChange={(e) => onChange({ ...filters, hideEarnings: e.target.checked })}
            className="rounded border-[var(--border)]"
          />
          {t.markets.hideEarnings}
        </label>
      </div>
    </div>
  );
}
