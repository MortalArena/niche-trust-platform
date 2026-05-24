import Link from 'next/link';
import { MarketplaceHeader } from '@/components/marketplace/marketplace-header';
import { LEARN_NAV } from '@/lib/learn/navigation';
import type { LearnDoc } from '@/lib/learn/types';
import { DocRenderer } from './doc-renderer';
import { LearnMobileNav } from './learn-mobile-nav';
import { LearnTopNav } from './learn-top-nav';

export function DocsShell({ doc }: { doc: LearnDoc }) {
  const currentPath = doc.slug ? `/learn/${doc.slug}` : '/learn';

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <MarketplaceHeader />
      <div className="mx-auto flex w-full max-w-7xl flex-1 gap-0 px-4 py-6 lg:gap-8">
        <aside className="hidden w-64 shrink-0 lg:block">
          <nav className="sticky top-28 max-h-[calc(100vh-8rem)] space-y-6 overflow-y-auto pr-2 text-sm">
            {LEARN_NAV.map((section) => (
              <div key={section.title}>
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
                  {section.title}
                </p>
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const active = currentPath === item.href;
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`block rounded-lg px-3 py-1.5 transition ${
                            active
                              ? 'bg-blue-50 font-medium text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                              : 'text-[var(--text-secondary)] hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)]'
                          }`}
                        >
                          {item.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        <main className="min-w-0 flex-1 pb-16">
          <LearnMobileNav currentPath={currentPath} />
          <LearnTopNav />

          <p className="mb-2 text-sm font-medium text-blue-600">Learn</p>
          <h1 className="mb-3 text-3xl font-bold tracking-tight text-[var(--text-primary)]">
            {doc.title}
          </h1>
          <p className="mb-8 text-lg text-[var(--text-secondary)]">{doc.description}</p>

          <DocRenderer blocks={doc.blocks} />

          <div className="mt-12 flex flex-wrap gap-4 border-t border-[var(--border)] pt-8 text-sm">
            <Link href="/learn" className="text-blue-600 hover:underline">
              ← Documentation home
            </Link>
            <Link href="/" className="text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              Back to app
            </Link>
          </div>
        </main>
      </div>
    </div>
  );
}
