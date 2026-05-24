import Link from 'next/link';
import { PageShell } from '@/components/ui/page-shell';
import { prisma } from '@/lib/db';
import { CreateBotForm } from '@/components/create-bot-form';

export const dynamic = 'force-dynamic';

export default async function BotsPage() {
  const bots = await prisma.expertBot.findMany({
    where: { isPublic: true },
    orderBy: { createdAt: 'desc' },
    take: 30,
    include: {
      expert: { select: { displayName: true, walletAddress: true, expertServiceTypes: true } },
    },
  });

  return (
    <PageShell showCategoryNav={false}>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Expert bots marketplace</h1>
      <p className="mb-8 max-w-2xl text-[var(--text-secondary)]">
        Bots experts sell, rent, or teach — trading automation, alerts, and quant tools.
      </p>

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        {bots.map((b) => (
          <div
            key={b.id}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-sm"
          >
            <div className="flex justify-between gap-2">
              <h2 className="font-semibold text-[var(--text-primary)]">{b.name}</h2>
              <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                {b.pricingModel}
              </span>
            </div>
            {b.description && (
              <p className="mt-2 line-clamp-3 text-sm text-[var(--text-secondary)]">{b.description}</p>
            )}
            <p className="mt-3 text-xs text-[var(--text-muted)]">
              by {b.expert.displayName ?? b.expert.walletAddress?.slice(0, 10)}…
              {b.priceUsd != null && Number(b.priceUsd) > 0 && (
                <span className="ml-2 font-semibold text-blue-600">${Number(b.priceUsd)}</span>
              )}
            </p>
            {b.externalUrl && (
              <a
                href={b.externalUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-blue-600 hover:underline"
              >
                View bot →
              </a>
            )}
          </div>
        ))}
      </div>

      {bots.length === 0 && (
        <p className="mb-8 text-[var(--text-muted)]">No bots listed yet. Experts can add one below.</p>
      )}

      <section className="rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6">
        <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">List your bot (experts)</h2>
        <CreateBotForm />
      </section>

      <Link href="/developers" className="mt-8 inline-block text-sm text-blue-600 hover:underline">
        Connect your AI agent →
      </Link>
    </PageShell>
  );
}
