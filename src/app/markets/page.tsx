import Link from 'next/link';
import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';
import { CategoryChips } from '@/components/marketplace/category-chips';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';
import { prisma } from '@/lib/db';
import { getServerI18n } from '@/lib/i18n/server';

export const dynamic = 'force-dynamic';

export default async function MarketsPage() {
  const { messages: t } = await getServerI18n();

  const counts = await prisma.group.groupBy({
    by: ['categorySlug'],
    where: { isPublic: true },
    _count: { id: true },
  });

  const countMap = Object.fromEntries(counts.map((c) => [c.categorySlug, c._count.id]));

  return (
    <MarketplaceShell showCategoryNav={false}>
      <CategoryChips />

      <h1 className="mb-2 text-xl font-bold text-[var(--text-primary)]">{t.markets.expertCategories}</h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Same verticals as Polymarket — experts sell signals and private information in each niche.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {MARKET_CATEGORIES.map((cat) => (
          <Link
            key={cat.slug}
            href={`/groups?category=${cat.slug}`}
            className="flex flex-col rounded-xl border border-[var(--border)] bg-[var(--surface)] p-5 transition hover:border-blue-300 hover:shadow-md"
          >
            <span className="text-3xl">{cat.icon}</span>
            <h2 className="mt-3 text-base font-semibold text-[var(--text-primary)]">{cat.name}</h2>
            <p className="mt-1 flex-1 text-sm text-[var(--text-secondary)]">{cat.description}</p>
            <p className="mt-4 text-xs font-medium text-blue-600">
              {countMap[cat.slug] ?? 0} {t.markets.publicGroups} · {t.markets.browseExperts}
            </p>
          </Link>
        ))}
      </div>

      <div className="mt-10 rounded-xl border border-[var(--border)] bg-[var(--surface-hover)] p-6">
        <h2 className="font-semibold text-[var(--text-primary)]">{t.markets.liveFromPolymarket}</h2>
        <Link href="/polymarket" className="mt-2 inline-block text-sm text-blue-600 hover:underline">
          → {t.nav.polymarket}
        </Link>
      </div>
    </MarketplaceShell>
  );
}
