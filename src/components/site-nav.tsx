'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';

export function SiteNav() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && session?.user;

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 px-6 py-4">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
        <Link href="/" className="text-xl font-bold text-violet-400">
          Niche Trust
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/markets" className="text-sm text-zinc-300 hover:text-white">
            Markets
          </Link>
          <Link href="/polymarket" className="text-sm text-emerald-400 hover:text-emerald-300">
            Polymarket live
          </Link>
          <Link href="/groups" className="text-sm text-zinc-300 hover:text-white">
            Groups
          </Link>
          <Link href="/platforms" className="text-sm text-zinc-300 hover:text-white">
            Platforms
          </Link>
          <Link href="/experts" className="text-sm text-zinc-300 hover:text-white">
            Experts
          </Link>
          {isLoggedIn && (
            <Link href="/admin" className="text-sm text-amber-400/90 hover:text-amber-300">
              Admin
            </Link>
          )}
          {isLoggedIn ? (
            <>
              <Link
                href="/dashboard"
                className="text-sm font-medium text-white hover:text-violet-300"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={() => signOut({ callbackUrl: '/' })}
                className="rounded-lg border border-zinc-600 px-3 py-1.5 text-sm text-zinc-300 hover:bg-zinc-800"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link
              href="/connect"
              className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </nav>
    </header>
  );
}
