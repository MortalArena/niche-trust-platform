import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { StarRating } from '@/components/star-rating';
import { getExpertServiceRating } from '@/lib/reviews/service';
import { getLeaderboard } from '@/lib/polymarket/leaderboard';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function ExpertsPage() {
  const [experts, pmLeaders] = await Promise.all([
    prisma.traderScore.findMany({
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
    }),
    getLeaderboard({ limit: 10, sortBy: 'edgeScore' }),
  ]);

  const serviceRatings = await Promise.all(
    experts.map((e) => getExpertServiceRating(e.userId))
  );

  return (
    <PageShell>
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Experts & intelligence</h1>
          <p className="text-sm text-[var(--text-secondary)]">
            Platform experts (on-chain + subscribers) and Polymarket wallet rankings — updated every 5
            minutes.
          </p>
        </div>
        <Link
          href="/leaderboard"
          className="rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"
        >
          Full intelligence leaderboard →
        </Link>
      </div>

      {pmLeaders.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">
            Top Polymarket wallets (Edge Score)
          </h2>
          <div className="space-y-2">
            {pmLeaders.map((entry) => (
              <a
                key={entry.trader.proxyWallet}
                href={`/trader/${entry.trader.proxyWallet}`}
                className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 hover:border-emerald-400"
              >
                <span className="font-medium text-[var(--text-primary)]">
                  #{entry.rank}{' '}
                  {entry.trader.displayName ??
                    entry.trader.pseudonym ??
                    `${entry.trader.proxyWallet.slice(0, 8)}…`}
                </span>
                <span className="text-sm font-bold text-emerald-600">
                  Edge {entry.trader.edgeScore.toFixed(0)}
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Niche Trust experts</h2>

      {experts.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center text-[var(--text-secondary)]">
          No experts yet. Link your wallet and run analysis from the dashboard.
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
                    {service.reviewCount > 0 && (
                      <div className="mt-1">
                        <StarRating rating={service.avgRating} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-6 text-sm">
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Trust</p>
                    <p className="font-bold text-blue-600">{Number(expert.trustScore).toFixed(0)}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-[var(--text-muted)]">Win %</p>
                    <p className="font-semibold">{Number(expert.winRate).toFixed(0)}</p>
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
