import { MarketplaceShell } from '@/components/marketplace/marketplace-shell';

/** Standard page wrapper — header, nav links, search, theme */
export function PageShell({
  children,
  showCategoryNav = false,
}: {
  children: React.ReactNode;
  showCategoryNav?: boolean;
}) {
  return <MarketplaceShell showCategoryNav={showCategoryNav}>{children}</MarketplaceShell>;
}
