'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';
import { useApp } from '@/components/providers/app-provider';

export function UserMenu() {
  const { t, theme, setTheme } = useApp();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex h-10 w-10 items-center justify-center rounded-lg hover:bg-[var(--surface-hover)]"
        aria-label="Menu"
      >
        <svg className="h-5 w-5 text-[var(--text-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 overflow-visible rounded-xl border border-[var(--border)] bg-[var(--surface)] py-2 shadow-xl">
          <MenuLink href="/experts" icon="🏆" label={t.menu.leaderboard} />
          <MenuLink href="/dashboard" icon="💰" label={t.menu.rewards} />
          <MenuLink href="/learn" icon="📖" label="Learn" />
          <MenuLink href="/learn/agent-api" icon="🔗" label={t.menu.apis} />
          <MenuLink href="/learn/encrypted-chat" icon="🔒" label="Encrypted chat" />

          <div className="my-2 border-t border-[var(--border)]" />

          <div className="flex items-center justify-between px-3 py-2">
            <span className="text-sm text-[var(--text-secondary)]">{t.menu.darkMode}</span>
            <button
              type="button"
              role="switch"
              aria-checked={theme === 'dark'}
              onClick={() => void setTheme(theme === 'dark' ? 'light' : 'dark')}
              className={`relative h-6 w-11 rounded-full transition ${theme === 'dark' ? 'bg-blue-600' : 'bg-zinc-300'}`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition ${theme === 'dark' ? 'left-5' : 'left-0.5'}`}
              />
            </button>
          </div>

          <div className="my-2 border-t border-[var(--border)]" />
          <MenuLink href="https://docs.polymarket.com" icon="📄" label={t.menu.documentation} external />
          <MenuLink href="/connect" icon="❓" label={t.menu.helpCenter} />

          {session?.user && (
            <button
              type="button"
              onClick={() => signOut({ callbackUrl: '/' })}
              className="mt-1 w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-[var(--surface-hover)]"
            >
              {t.header.signOut}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  href,
  icon,
  label,
  external,
}: {
  href: string;
  icon: string;
  label: string;
  external?: boolean;
}) {
  const className =
    'flex items-center gap-3 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-hover)]';
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={className}>
        <span>{icon}</span>
        {label}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      <span>{icon}</span>
      {label}
    </Link>
  );
}
