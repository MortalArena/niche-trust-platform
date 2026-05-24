'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const API_PATHS = new Set([
  '/learn/api-reference',
  '/learn/authentication',
  '/learn/polymarket-data',
  '/learn/documentation-scope',
]);

export function LearnTopNav() {
  const pathname = usePathname();
  const apiSection = API_PATHS.has(pathname);

  const tabClass = (active: boolean) =>
    `border-b-2 px-1 pb-3 text-sm font-medium transition ${
      active
        ? 'border-blue-600 text-blue-600'
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
    }`;

  return (
    <div className="mb-8 flex gap-8 border-b border-[var(--border)]">
      <Link href="/learn" className={tabClass(!apiSection)}>
        Documentation
      </Link>
      <Link href="/learn/api-reference" className={tabClass(apiSection)}>
        API Reference
      </Link>
      <a
        href="https://docs.polymarket.com/"
        target="_blank"
        rel="noreferrer"
        className="ml-auto hidden pb-3 text-sm text-[var(--text-muted)] hover:text-blue-600 sm:inline"
      >
        Polymarket official docs ↗
      </a>
    </div>
  );
}
