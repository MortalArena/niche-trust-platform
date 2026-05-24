'use client';

import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useApp } from '@/components/providers/app-provider';

type QuickLink = {
  href: string;
  icon: string;
  labelKey: string;
  accent?: string;
  auth?: boolean;
  guestOnly?: boolean;
};

const LINKS: QuickLink[] = [
  { href: '/polymarket', icon: '📈', labelKey: 'polymarket', accent: 'text-emerald-600' },
  { href: '/markets', icon: '🏷️', labelKey: 'markets' },
  { href: '/groups', icon: '👥', labelKey: 'groups' },
  { href: '/experts', icon: '⭐', labelKey: 'experts' },
  { href: '/platforms', icon: '🔗', labelKey: 'platforms' },
  { href: '/search', icon: '🔍', labelKey: 'search' },
  { href: '/bots', icon: '🤖', labelKey: 'bots' },
  { href: '/learn', icon: '📖', labelKey: 'learn' },
  { href: '/dashboard', icon: '📊', labelKey: 'dashboard', auth: true },
  { href: '/publish', icon: '✍️', labelKey: 'publish', auth: true },
  { href: '/connect', icon: '🔐', labelKey: 'connect', guestOnly: true },
  { href: '/admin', icon: '⚙️', labelKey: 'admin', auth: true },
];

export function HomeQuickNav() {
  const { t } = useApp();
  const { data: session } = useSession();

  const labels: Record<string, string> = {
    polymarket: t.nav.polymarket,
    markets: t.nav.markets,
    groups: t.nav.groups,
    experts: t.nav.experts,
    platforms: t.nav.platforms,
    dashboard: t.nav.dashboard,
    publish: 'Publish prediction',
    connect: t.header.login,
    admin: t.nav.admin,
    search: 'Search',
    bots: 'Expert bots',
    learn: 'Learn (docs)',
  };

  return (
    <section className="mb-10">
      <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[var(--text-muted)]">
        Explore the platform
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {LINKS.filter((l) => {
          if (l.auth && !session?.user) return false;
          if ('guestOnly' in l && l.guestOnly && session?.user) return false;
          return true;
        }).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--text-primary)] shadow-sm transition hover:border-blue-400 hover:shadow-md"
          >
            <span className="text-xl" aria-hidden>
              {item.icon}
            </span>
            <span className={item.accent ?? ''}>{labels[item.labelKey]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
