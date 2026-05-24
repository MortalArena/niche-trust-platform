import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { StarRating } from '@/components/star-rating';
import { getCategoryBySlug } from '@/lib/markets/categories';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const catInfo = category ? getCategoryBySlug(category) : null;

  const groups = await prisma.group.findMany({
    where: {
      isPublic: true,
      ...(category ? { categorySlug: category } : {}),
    },
    orderBy: { subscriberCount: 'desc' },
    take: 30,
    include: {
      owner: {
        select: {
          displayName: true,
          walletAddress: true,
          scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' } },
        },
      },
    },
  });

  return (
    <PageShell>
      <div className="mb-6 rounded-xl border border-violet-200 bg-violet-50 p-4 text-sm text-violet-900 dark:border-violet-800 dark:bg-violet-950/40 dark:text-violet-100">
        <p className="font-semibold">🔒 Private encrypted chat (Matrix E2EE)</p>
        <p className="mt-1 text-violet-800 dark:text-violet-200">
          Subscribe to any group → open the group page → tab <strong>Encrypted chat</strong>. Set your
          Matrix ID in the dashboard if prompted. Experts and subscribers only — not public comments.
        </p>
      </div>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            {catInfo ? `${catInfo.name} groups` : 'Paid expert groups'}
          </h1>
          {catInfo && <p className="text-sm text-[var(--text-secondary)]">{catInfo.description}</p>}
        </div>
        <div className="flex gap-3">
          <Link href="/groups/new" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Create group
          </Link>
          <Link href="/markets" className="rounded-lg border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)]">
            All categories
          </Link>
        </div>
      </div>

      {groups.length === 0 ? (
        <p className="rounded-xl border border-[var(--border)] p-8 text-center text-[var(--text-secondary)]">
          No groups in this category yet.
        </p>
      ) : (
        <div className="space-y-4">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/groups/${g.id}`}
              className="block rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm hover:border-blue-400"
            >
              <div className="flex justify-between gap-4">
                <div>
                  <p className="text-xs font-medium text-blue-600">{g.categorySlug}</p>
                  <h2 className="text-lg font-semibold text-[var(--text-primary)]">{g.name}</h2>
                  {g.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-[var(--text-secondary)]">{g.description}</p>
                  )}
                  <p className="mt-2 text-xs text-[var(--text-muted)]">
                    Expert: {g.owner.displayName ?? g.owner.walletAddress?.slice(0, 8)}...
                    {g.owner.scores[0] && (
                      <span className="ml-2 font-medium text-blue-600">
                        Wallet trust {Number(g.owner.scores[0].trustScore).toFixed(0)}
                      </span>
                    )}
                  </p>
                  {g.reviewCount > 0 && (
                    <div className="mt-2">
                      <StarRating rating={Number(g.avgRating)} size="sm" />
                      <span className="ml-1 text-xs text-[var(--text-muted)]">
                        {g.reviewCount} verified reviews
                      </span>
                    </div>
                  )}
                </div>
                <div className="shrink-0 text-right text-sm">
                  <p className="font-bold text-blue-600">${Number(g.monthlyPriceUsd)}/mo</p>
                  <p className="text-[var(--text-secondary)]">{g.subscriberCount} subscribers</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </PageShell>
  );
}
