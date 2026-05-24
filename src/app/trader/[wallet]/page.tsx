import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/ui/page-shell';
import { StarRating } from '@/components/star-rating';
import { getExpertServiceRating } from '@/lib/reviews/service';
import { getCategoryBySlug } from '@/lib/markets/categories';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function TraderProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;

  const user = await prisma.user.findFirst({
    where: {
      OR: [{ walletAddress: wallet }, { wallets: { some: { address: wallet } } }],
    },
    include: {
      scores: { orderBy: { lastCalculatedAt: 'desc' }, take: 1 },
      wallets: true,
      ownedGroups: {
        where: { isPublic: true },
        take: 10,
        orderBy: { avgRating: 'desc' },
      },
      predictions: {
        where: { visibility: 'public' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      },
    },
  });

  if (!user) notFound();

  const score = user.scores[0];
  const serviceRating = await getExpertServiceRating(user.id);
  const chainBreakdown = score?.chainBreakdown as Record<
    string,
    { trustScore: number; trades: number }
  > | null;

  const displayName = user.displayName ?? `${wallet.slice(0, 6)}…${wallet.slice(-4)}`;

  return (
    <PageShell showCategoryNav={false}>
      <div className="mx-auto max-w-4xl">
        <Link
          href="/experts"
          className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
        >
          ← Experts
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{displayName}</h1>
        <p className="mb-6 font-mono text-sm text-[var(--text-muted)]">{wallet}</p>

        {serviceRating.reviewCount > 0 && (
          <div className="mb-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm">
            <p className="mb-1 text-sm text-[var(--text-secondary)]">
              Subscriber satisfaction (verified payments)
            </p>
            <StarRating rating={serviceRating.avgRating} />
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              {serviceRating.reviewCount} reviews across paid groups
            </p>
          </div>
        )}

        {score ? (
          <>
            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Wallet trust" value={Number(score.trustScore).toFixed(1)} />
              <Metric label="ROI %" value={Number(score.roi).toFixed(2)} />
              <Metric label="Win rate %" value={Number(score.winRate).toFixed(1)} />
              <Metric label="Risk" value={score.riskLevel} />
            </div>
            {chainBreakdown && (
              <p className="mb-6 text-xs text-[var(--text-muted)]">
                Analyzed per chain:{' '}
                {Object.entries(chainBreakdown)
                  .map(([c, d]) => `${c} (${d.trades} trades)`)
                  .join(' · ')}
              </p>
            )}
          </>
        ) : (
          <p className="mb-8 text-[var(--text-secondary)]">No on-chain trust score computed yet.</p>
        )}

        <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Linked wallets</p>
        <ul className="mb-8 flex flex-wrap gap-2 text-xs">
          {user.wallets.map((w) => (
            <li
              key={w.id}
              className="rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1.5 font-mono text-[var(--text-secondary)]"
            >
              {w.chain}: {w.address.slice(0, 10)}…
            </li>
          ))}
        </ul>

        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Public groups & encrypted chat</h2>
        {user.ownedGroups.length === 0 ? (
          <p className="mb-8 text-[var(--text-secondary)]">No public groups.</p>
        ) : (
          <ul className="mb-8 space-y-3">
            {user.ownedGroups.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
              >
                <Link href={`/groups/${g.id}`} className="font-medium text-blue-600 hover:underline">
                  {g.name}
                </Link>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {getCategoryBySlug(g.categorySlug)?.name ?? g.categorySlug}
                  {g.reviewCount > 0 && ` · ★ ${Number(g.avgRating).toFixed(1)}`}
                  {' · '}
                  Subscribe → open <strong>Encrypted chat</strong> tab
                </p>
              </li>
            ))}
          </ul>
        )}

        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Public predictions</h2>
        <p className="mb-2 text-xs text-[var(--text-muted)]">
          Hashes attested on Solana Memo (content stays encrypted off-chain).
        </p>
        {user.predictions.length === 0 ? (
          <p className="text-[var(--text-secondary)]">No public predictions.</p>
        ) : (
          <ul className="space-y-3">
            {user.predictions.map((pred) => (
              <li key={pred.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-muted)]">
                    {pred.createdAt.toLocaleDateString('en-US')}
                  </span>
                  <span className="text-[var(--text-primary)]">{pred.outcome}</span>
                </div>
                <a
                  href={`/api/prediction/verify/${pred.contentHash}`}
                  className="mt-2 inline-block text-sm text-blue-600 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  Verify on-chain
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </PageShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-bold text-[var(--text-primary)]">{value}</p>
    </div>
  );
}
