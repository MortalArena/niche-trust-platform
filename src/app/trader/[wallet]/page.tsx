import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageShell } from '@/components/ui/page-shell';
import { StarRating } from '@/components/star-rating';
import { getExpertServiceRating } from '@/lib/reviews/service';
import { getCategoryBySlug } from '@/lib/markets/categories';
import { prisma } from '@/lib/db';
import { syncPolymarketTrader } from '@/lib/polymarket/leaderboard';

export const dynamic = 'force-dynamic';

export default async function TraderProfilePage({
  params,
}: {
  params: Promise<{ wallet: string }>;
}) {
  const { wallet } = await params;
  const normalized = wallet.toLowerCase();

  const [user, pmTrader] = await Promise.all([
    prisma.user.findFirst({
      where: {
        OR: [{ walletAddress: normalized }, { wallets: { some: { address: normalized } } }],
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
    }),
    prisma.polymarketTrader.findUnique({ where: { proxyWallet: normalized } }),
  ]);

  if (!user && !pmTrader) {
    const synced = await syncPolymarketTrader(normalized, 'all');
    if (!synced) notFound();
    return (
      <PageShell showCategoryNav={false}>
        <PolymarketIntelligenceProfile wallet={normalized} trader={synced} />
      </PageShell>
    );
  }

  if (!user && pmTrader) {
    const brief = {
      proxyWallet: pmTrader.proxyWallet,
      displayName: pmTrader.displayName,
      pseudonym: pmTrader.pseudonym,
      verifiedBadge: pmTrader.verifiedBadge,
      xUsername: pmTrader.xUsername,
      trustScore: Number(pmTrader.trustScore),
      edgeScore: Number(pmTrader.edgeScore),
      winRate: Number(pmTrader.winRate),
      roi: Number(pmTrader.roi),
      maxDrawdown: Number(pmTrader.maxDrawdown),
      consistency: Number(pmTrader.consistency),
      profitFactor: Number(pmTrader.profitFactor),
      riskLevel: pmTrader.riskLevel,
      totalTrades: pmTrader.totalTrades,
      activityDays: pmTrader.activityDays,
      avgTradeSize: Number(pmTrader.avgTradeSize),
      totalVolumeUsd: Number(pmTrader.totalVolumeUsd),
      timingScore: Number(pmTrader.timingScore),
      categories: pmTrader.categories,
      polymarketUrl: `https://polymarket.com/profile/${pmTrader.proxyWallet}`,
    };
    return (
      <PageShell showCategoryNav={false}>
        <PolymarketIntelligenceProfile wallet={normalized} trader={brief} />
      </PageShell>
    );
  }

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
          href="/leaderboard"
          className="mb-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
        >
          ← Intelligence leaderboard
        </Link>

        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{displayName}</h1>
        <p className="mb-6 font-mono text-sm text-[var(--text-muted)]">{wallet}</p>

        {pmTrader && (
          <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5">
            <p className="mb-3 text-sm font-medium text-[var(--text-primary)]">
              Polymarket intelligence
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Metric label="Edge Score" value={Number(pmTrader.edgeScore).toFixed(1)} />
              <Metric label="ROI %" value={Number(pmTrader.roi).toFixed(1)} />
              <Metric label="Win rate %" value={Number(pmTrader.winRate).toFixed(0)} />
              <Metric label="Volume" value={`$${(Number(pmTrader.totalVolumeUsd) / 1000).toFixed(0)}k`} />
            </div>
            <a
              href={`https://polymarket.com/profile/${pmTrader.proxyWallet}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline"
            >
              View on Polymarket ↗
            </a>
          </div>
        )}

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

        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">
          Public groups & encrypted chat
        </h2>
        {user.ownedGroups.length === 0 ? (
          <p className="mb-8 text-[var(--text-secondary)]">No public groups.</p>
        ) : (
          <ul className="mb-8 space-y-3">
            {user.ownedGroups.map((g) => (
              <li
                key={g.id}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm"
              >
                <Link href={`/groups/${g.id}`} className="font-medium text-[var(--accent)] hover:underline">
                  {g.name}
                </Link>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  {getCategoryBySlug(g.categorySlug)?.name ?? g.categorySlug}
                  {g.reviewCount > 0 && ` · ★ ${Number(g.avgRating).toFixed(1)}`}
                  {' · '}
                  Subscribe → open Encrypted chat tab
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
                  className="mt-2 inline-block text-sm text-[var(--accent)] hover:underline"
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

function PolymarketIntelligenceProfile({
  wallet,
  trader,
}: {
  wallet: string;
  trader: {
    displayName: string | null;
    pseudonym: string | null;
    verifiedBadge: boolean | null;
    xUsername: string | null;
    edgeScore: number;
    trustScore: number;
    winRate: number;
    roi: number;
    maxDrawdown: number;
    consistency: number;
    profitFactor: number;
    riskLevel: string;
    totalTrades: number;
    activityDays: number;
    avgTradeSize: number;
    totalVolumeUsd: number;
    timingScore: number;
    categories: string[];
    polymarketUrl?: string;
  };
}) {
  const name = trader.displayName || trader.pseudonym || 'Polymarket trader';

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/leaderboard"
        className="mb-6 inline-block text-sm font-medium text-[var(--accent)] hover:underline"
      >
        ← Intelligence leaderboard
      </Link>

      <p className="text-xs font-semibold uppercase tracking-wider text-[var(--accent)]">
        Polymarket wallet
      </p>
      <h1 className="mb-2 mt-1 text-2xl font-bold text-[var(--text-primary)]">{name}</h1>
      <p className="mb-6 font-mono text-sm text-[var(--text-muted)]">{wallet}</p>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Edge Score" value={trader.edgeScore.toFixed(1)} highlight />
        <Metric label="Trust Score" value={trader.trustScore.toFixed(1)} />
        <Metric label="ROI %" value={`${trader.roi >= 0 ? '+' : ''}${trader.roi.toFixed(1)}`} />
        <Metric label="Win rate %" value={trader.winRate.toFixed(0)} />
        <Metric label="Consistency" value={trader.consistency.toFixed(0)} />
        <Metric label="Max drawdown %" value={trader.maxDrawdown.toFixed(1)} />
        <Metric label="Timing score" value={trader.timingScore.toFixed(0)} />
        <Metric label="Risk" value={trader.riskLevel} />
        <Metric label="Trades" value={String(trader.totalTrades)} />
        <Metric label="Active days" value={String(trader.activityDays)} />
        <Metric label="Avg trade" value={`$${trader.avgTradeSize.toFixed(0)}`} />
        <Metric label="Volume" value={`$${(trader.totalVolumeUsd / 1000).toFixed(0)}k`} />
      </div>

      {trader.categories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {trader.categories.map((cat) => (
            <span
              key={cat}
              className="rounded-full border border-[var(--border)] px-3 py-1 text-xs text-[var(--text-secondary)]"
            >
              {cat}
            </span>
          ))}
        </div>
      )}

      {trader.polymarketUrl && (
        <a
          href={trader.polymarketUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-lg bg-[var(--accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          View full history on Polymarket ↗
        </a>
      )}

      <p className="mt-8 text-xs text-[var(--text-secondary)]">
        Edge Score blends ROI, consistency, risk, timing, and volume — not luck alone.{' '}
        <Link href="/learn/intelligence-engine" className="text-[var(--accent)] hover:underline">
          Methodology
        </Link>
      </p>
    </div>
  );
}

function Metric({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 shadow-sm">
      <p className="text-xs font-medium text-[var(--text-muted)]">{label}</p>
      <p
        className={`mt-1 text-2xl font-bold ${highlight ? 'text-[var(--accent)]' : 'text-[var(--text-primary)]'}`}
      >
        {value}
      </p>
    </div>
  );
}
