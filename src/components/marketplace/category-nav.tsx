'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';
import { CATEGORY_NAV, FEATURED_NAV } from '@/lib/markets/navigation';

export function CategoryNav({ basePath = '/polymarket' }: { basePath?: string }) {
  const { t } = useApp();
  const searchParams = useSearchParams();
  const active = searchParams.get('cat') ?? 'trending';

  const link = (slug: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('cat', slug);
    return `${basePath}?${params.toString()}`;
  };

  const isActive = (slug: string) => active === slug;

  return (
    <nav className="border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-4 py-2 scrollbar-thin">
        {FEATURED_NAV.map((item) => (
          <Link
            key={item.slug}
            href={link(item.slug)}
            className={`shrink-0 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
              isActive(item.slug)
                ? 'bg-[var(--surface-hover)] text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {'icon' in item && item.icon === 'chart' && (
              <span className="mr-1 inline-block text-emerald-600">↗</span>
            )}
            {t.nav[item.labelKey]}
          </Link>
        ))}

        <span className="mx-2 h-5 w-px shrink-0 bg-[var(--border)]" aria-hidden />

        {CATEGORY_NAV.map((item) => (
          <Link
            key={item.slug}
            href={link(item.slug)}
            className={`shrink-0 whitespace-nowrap px-3 py-1.5 text-sm transition ${
              isActive(item.slug)
                ? 'font-semibold text-[var(--text-primary)]'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            {t.nav[item.labelKey]}
          </Link>
        ))}

        <span className="shrink-0 px-2 text-sm text-[var(--text-muted)]">
          {t.nav.more} ▾
        </span>
      </div>
    </nav>
  );
}
