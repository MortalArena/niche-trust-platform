import { Suspense } from 'react';
import { MarketplaceHeader } from './marketplace-header';
import { CategoryNav } from './category-nav';
import { MarketplaceFooter } from './marketplace-footer';

export function MarketplaceShell({
  children,
  showCategoryNav = true,
  basePath,
}: {
  children: React.ReactNode;
  showCategoryNav?: boolean;
  basePath?: string;
}) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[var(--bg)]">
      <MarketplaceHeader />
      {showCategoryNav && (
        <Suspense fallback={<div className="h-10 border-b border-[var(--border)]" />}>
          <CategoryNav basePath={basePath} />
        </Suspense>
      )}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6">{children}</main>
      <MarketplaceFooter />
    </div>
  );
}
