import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { listManifoldMarkets } from '@/lib/manifold/client';

export const dynamic = 'force-dynamic';

export default async function ManifoldPage() {
  let markets: { id?: string; question?: string; probability?: number; volume?: number }[] = [];
  let error: string | null = null;

  try {
    const data = await listManifoldMarkets(15);
    markets = Array.isArray(data) ? data : [];
  } catch (e) {
    error = e instanceof Error ? e.message : 'Manifold API error';
  }

  return (
    <PageShell showCategoryNav={false}>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Manifold Markets</h1>
      <p className="mb-6 text-sm text-[var(--text-secondary)]">
        Play-money prediction markets via api.manifold.markets — reputation signals for experts.
      </p>

      {error && <p className="mb-4 font-medium text-red-600">{error}</p>}

      <div className="space-y-3">
        {markets.map((m) => (
          <a
            key={m.id}
            href={`https://manifold.markets/${m.id}`}
            target="_blank"
            rel="noreferrer"
            className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm hover:border-blue-400"
          >
            <h2 className="font-medium text-[var(--text-primary)]">{m.question ?? 'Market'}</h2>
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              Prob: {m.probability != null ? `${(m.probability * 100).toFixed(0)}%` : '—'} · Vol:{' '}
              {m.volume ?? 0} mana
            </p>
          </a>
        ))}
      </div>

      <Link href="/platforms" className="mt-8 inline-block text-sm font-medium text-blue-600 hover:underline">
        ← Platforms
      </Link>
    </PageShell>
  );
}
