'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useApp } from '@/components/providers/app-provider';
import { UserMenu } from './user-menu';
import { GlobalSearch } from './global-search';
const NAV_LINKS = [
  { href: '/markets', key: 'markets' as const },
  { href: '/polymarket', key: 'polymarket' as const, accent: true },
  { href: '/groups', key: 'groups' as const },
  { href: '/experts', key: 'experts' as const },
  { href: '/platforms', key: 'platforms' as const },
  { href: '/learn', key: 'learn' as const, accentBlue: true },
  { href: '/bots', key: 'bots' as const },
] as const;

export function MarketplaceHeader() {
  const { t } = useApp();
  const { data: session } = useSession();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '/' && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        e.preventDefault();
        document.querySelector<HTMLInputElement>('input[name="q"]')?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg)]">
      <div className="mx-auto max-w-7xl px-4 py-3">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex shrink-0 items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-bold text-white">
              NT
            </span>
            <span className="hidden font-semibold text-[var(--text-primary)] sm:inline">{t.brand}</span>
          </Link>

          <div className="mx-auto hidden max-w-md flex-1 lg:block">
            <GlobalSearch />
          </div>

          <div className="ml-auto flex items-center gap-1 sm:gap-2">
            <Link
              href="/learn"
              className="hidden text-sm font-medium text-blue-600 hover:underline xl:inline"
            >
              Learn
            </Link>
            <Link
              href="/connect"
              className="hidden items-center gap-1 text-sm text-blue-600 hover:underline xl:flex"
            >
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-blue-100 text-xs text-blue-600">
                i
              </span>
              {t.header.howItWorks}
            </Link>

            {session?.user ? (
              <>
                <Link
                  href="/dashboard"
                  className="rounded-lg px-2 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] sm:px-3"
                >
                  {t.nav.dashboard}
                </Link>
                <button
                  type="button"
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="hidden rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] sm:inline-block"
                >
                  {t.header.signOut}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/connect"
                  className="rounded-lg px-2 py-2 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] sm:px-3"
                >
                  {t.header.login}
                </Link>
                <Link
                  href="/connect"
                  className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 sm:px-4"
                >
                  {t.header.signup}
                </Link>
              </>
            )}

            <UserMenu />
          </div>
        </div>

        {/* Mobile + tablet search — always visible */}
        <div className="mt-3 lg:hidden">
          <GlobalSearch />
        </div>

        {/* Main navigation — all pages visible */}
        <nav className="mt-3 flex flex-wrap items-center gap-1 border-t border-[var(--border)] pt-3">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition hover:bg-[var(--surface-hover)] ${
                'accent' in link && link.accent
                  ? 'text-emerald-600'
                  : 'accentBlue' in link && link.accentBlue
                    ? 'text-blue-600'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.nav[link.key]}
            </Link>
          ))}
          <Link
            href="/learn/encrypted-chat"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-950"
          >
            Private chat
          </Link>
          <Link
            href="/search"
            className="rounded-lg px-3 py-1.5 text-sm font-medium text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
          >
            Search
          </Link>
        </nav>
      </div>
    </header>
  );
}
