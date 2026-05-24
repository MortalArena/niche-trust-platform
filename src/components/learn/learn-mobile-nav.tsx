'use client';

import { useRouter } from 'next/navigation';
import { LEARN_NAV } from '@/lib/learn/navigation';

export function LearnMobileNav({ currentPath }: { currentPath: string }) {
  const router = useRouter();

  return (
    <div className="mb-6 lg:hidden">
      <label htmlFor="learn-mobile-nav" className="sr-only">
        Documentation section
      </label>
      <select
        id="learn-mobile-nav"
        className="w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm text-[var(--text-primary)]"
        value={currentPath}
        onChange={(e) => router.push(e.target.value)}
      >
        {LEARN_NAV.flatMap((s) =>
          s.items.map((item) => (
            <option key={item.href} value={item.href}>
              {s.title}: {item.title}
            </option>
          ))
        )}
      </select>
    </div>
  );
}
