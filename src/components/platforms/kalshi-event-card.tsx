import type { KalshiEventCard } from '@/lib/kalshi/parse';

export function KalshiEventCardView({ event }: { event: KalshiEventCard }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm transition hover:border-cyan-500/60 hover:shadow-md"
    >
      <div className="mb-2 flex flex-wrap items-center gap-2">
        {event.category && (
          <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-medium text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300">
            {event.category}
          </span>
        )}
        <span className="text-xs font-medium text-[var(--text-muted)]">Kalshi</span>
      </div>
      <h2 className="text-lg font-semibold leading-snug text-[var(--text-primary)]">{event.title}</h2>
      {event.subtitle && (
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{event.subtitle}</p>
      )}
      <p className="mt-3 text-xs text-cyan-600">Open on Kalshi →</p>
    </a>
  );
}
