'use client';

import { useRouter } from 'next/navigation';
import { useApp } from '@/components/providers/app-provider';

interface GlobalSearchProps {
  className?: string;
  size?: 'default' | 'large';
  defaultQuery?: string;
}

export function GlobalSearch({ className = '', size = 'default', defaultQuery = '' }: GlobalSearchProps) {
  const { t } = useApp();
  const router = useRouter();
  const isLarge = size === 'large';

  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = new FormData(e.currentTarget).get('q')?.toString().trim();
    if (q) router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form onSubmit={onSubmit} className={className}>
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          name="q"
          type="search"
          defaultValue={defaultQuery}
          placeholder={t.header.searchPlaceholder}
          className={`w-full rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:border-blue-500 focus:outline-none ${
            isLarge ? 'py-3.5 pl-11 pr-14 text-base' : 'py-2.5 pl-10 pr-12 text-sm'
          }`}
        />
        <button
          type="submit"
          className={`absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-blue-600 font-medium text-white hover:bg-blue-700 ${
            isLarge ? 'px-4 py-1.5 text-sm' : 'px-3 py-1 text-xs'
          }`}
        >
          Search
        </button>
      </div>
    </form>
  );
}
