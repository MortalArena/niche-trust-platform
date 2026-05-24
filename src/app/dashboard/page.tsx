import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageShell } from '@/components/ui/page-shell';
import { DashboardView } from '@/components/dashboard-view';
import { prisma } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connect');

  const [score, userRow] = await Promise.all([
    prisma.traderScore.findUnique({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { expertBalanceUsd: true },
    }),
  ]);

  const chainBreakdown = score?.chainBreakdown as Record<
    string,
    { trustScore: number; trades: number; txs: number }
  > | null;

  const wallet = (session.user as { walletAddress?: string }).walletAddress ?? null;

  return (
    <PageShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Dashboard</h1>
        <p className="mb-6 text-sm text-[var(--text-secondary)]">
          Switch between customer and expert views below.
        </p>
        <DashboardView
          trustScore={score ? Number(score.trustScore) : null}
          roi={score ? Number(score.roi) : null}
          winRate={score ? Number(score.winRate) : null}
          maxDrawdown={score ? Number(score.maxDrawdown) : null}
          chainBreakdown={chainBreakdown}
          walletAddress={wallet}
          expertBalanceUsd={Number(userRow?.expertBalanceUsd ?? 0)}
        />
      </div>
    </PageShell>
  );
}
