import { Suspense } from 'react';
import { SearchPageClient } from './search-client';

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-[var(--text-muted)]">Loading search…</div>}>
      <SearchPageClient />
    </Suspense>
  );
}
