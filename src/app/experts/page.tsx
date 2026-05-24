import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { StarRating } from '@/components/star-rating';
import { getExpertServiceRating } from '@/lib/reviews/service';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ExpertsPage() {
  const experts = await prisma.traderScore.findMany({
    orderBy: { trustScore: 'desc' },
    take: 20,
    include: {
      user: {
        select: {
          id: true,
          walletAddress: true,
          displayName: true,
          isAnonymous: true,
        },
      },
    },
  });

  const serviceRatings = await Promise.all(
    experts.map((e) => getExpertServiceRating(e.userId))
  );

  return (
    <PageShell>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Top experts</h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Wallet trust from on-chain history (per network) + star ratings from verified paying
        subscribers.
      </p>

      {experts.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
          No experts yet. Link your Polygon wallet and run analysis.
        </p>
      ) : (
        <div className="space-y-4">
          {experts.map((expert, index) => {
            const service = serviceRatings[index];
            const href = expert.user.walletAddress
              ? `/trader/${expert.user.walletAddress}`
              : `/trader/id/${expert.userId}`;

            return (
              <Link
                key={expert.id}
                href={href}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm transition hover:border-blue-400"
              >
                <div className="flex items-center gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                    {index + 1}
                  </span>
                  <div>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {expert.user.isAnonymous
                        ? 'Anonymous'
                        : expert.user.displayName ??
                          `${expert.user.walletAddress?.slice(0, 6) ?? 'Expert'}...`}
                    </p>
                    {expert.user.walletAddress && (
                      <p className="font-mono text-xs text-[var(--text-muted)]">
                        {expert.user.walletAddress.slice(0, 10)}...
                      </p>
                    )}
                    {service.reviewCount > 0 && (
                      <div className="mt-1">
                        <StarRating rating={service.avgRating} size="sm" />
                        <span className="text-xs text-[var(--text-muted)]">
                          {' '}
                          {service.reviewCount} subscriber reviews
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 text-sm text-[var(--text-primary)]">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Wallet trust</p>
                    <p className="font-bold text-blue-600">{Number(expert.trustScore).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Win %</p>
                    <p className="font-semibold">{Number(expert.winRate).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Risk</p>
                    <p className="font-semibold">{expert.riskLevel}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </PageShell>
  );
}
