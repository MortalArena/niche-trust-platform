'use client';

import Link from 'next/link';
import { useApp } from '@/components/providers/app-provider';
import { MARKET_CATEGORIES } from '@/lib/markets/categories';

export function CategoryChips() {
  const { t } = useApp();

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-2">
      <Link
        href="/markets"
        className="shrink-0 rounded-full bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        {t.markets.sortAll}
      </Link>
      {MARKET_CATEGORIES.map((cat) => (
        <Link
          key={cat.slug}
          href={`/groups?category=${cat.slug}`}
          className="shrink-0 whitespace-nowrap rounded-full border border-[var(--border)] bg-[var(--surface)] px-4 py-1.5 text-sm font-medium text-[var(--text-primary)] hover:border-blue-400 hover:bg-[var(--surface-hover)]"
        >
          {cat.icon} {cat.name}
        </Link>
      ))}
    </div>
  );
}
