'use client';

import Image from 'next/image';
import { useApp } from '@/components/providers/app-provider';
import type { ParsedMarketCard } from '@/lib/polymarket/parse-market';
import { formatVolumeDisplay } from '@/lib/polymarket/parse-market';

export function MarketCard({ card }: { card: ParsedMarketCard }) {
  const { t } = useApp();
  const vol = card.volume24hrUsd ?? card.volumeUsd;

  return (
    <a
      href={card.href}
      target="_blank"
      rel="noreferrer"
      className="group flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-blue-300 hover:shadow-md"
    >
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-[var(--surface-hover)] text-lg">
          {card.imageUrl ? (
            <Image
              src={card.imageUrl}
              alt=""
              width={44}
              height={44}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <span>📊</span>
          )}
        </div>
        <h3 className="line-clamp-3 flex-1 text-sm font-semibold leading-snug text-[var(--text-primary)] group-hover:text-blue-600">
          {card.question}
        </h3>
      </div>

      <div className="mt-4 space-y-2">
        {card.outcomes.slice(0, 2).map((o, i) => (
          <div key={o.label} className="flex items-center gap-2 text-sm">
            <span className="min-w-0 flex-1 truncate text-[var(--text-secondary)]">{o.label}</span>
            <span className="font-semibold tabular-nums text-[var(--text-primary)]">{o.probability}%</span>
            <span
              className={`rounded-md px-2.5 py-1 text-xs font-medium ${
                i === 0
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}
            >
              {i === 0 ? t.card.yes : t.card.no}
            </span>
          </div>
        ))}
      </div>

      <div className="mt-auto flex items-center justify-between pt-4 text-xs text-[var(--text-muted)]">
        <span>
          {formatVolumeDisplay(vol)} {t.card.vol}
        </span>
        {card.categoryLabel && (
          <span className="truncate rounded bg-[var(--surface-hover)] px-2 py-0.5">
            {card.categoryLabel}
          </span>
        )}
      </div>
    </a>
  );
}
