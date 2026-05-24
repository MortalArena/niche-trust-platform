import Link from 'next/link';

const SOURCES = [
  { href: '/polymarket', name: 'Polymarket', desc: 'Live events & odds (Gamma API)', color: 'text-emerald-600' },
  { href: '/platforms/kalshi', name: 'Kalshi', desc: 'US regulated events', color: 'text-cyan-600' },
  { href: '/platforms/manifold', name: 'Manifold', desc: 'Play-money markets', color: 'text-violet-600' },
  { href: '/groups', name: 'Expert groups', desc: 'Paid signals & encrypted chat', color: 'text-blue-600' },
] as const;

export function HomeDataSources({ refreshedAt }: { refreshedAt: Date }) {
  const mins = Math.max(0, Math.floor((Date.now() - refreshedAt.getTime()) / 60000));

  return (
    <section className="mb-10">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
          Data sources on Niche Trust
        </h2>
        <p className="text-xs text-[var(--text-muted)]">
          Trending odds refresh every ~15 min
          {mins === 0 ? ' · just updated' : ` · last fetch ${mins}m ago`}
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {SOURCES.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 transition hover:border-blue-300 hover:shadow-sm"
          >
            <p className={`font-semibold ${s.color}`}>{s.name}</p>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">{s.desc}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}
