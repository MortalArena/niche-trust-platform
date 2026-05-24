/** Horizontal nav chips — aligned with Polymarket top taxonomy */
export const FEATURED_NAV = [
  { slug: 'trending', labelKey: 'trending' as const, icon: 'chart' },
  { slug: 'breaking', labelKey: 'breaking' as const },
  { slug: 'new', labelKey: 'new' as const },
] as const;

export const CATEGORY_NAV = [
  { slug: 'politics', labelKey: 'politics' as const, tagSlug: 'politics' },
  { slug: 'sports', labelKey: 'sports' as const, tagSlug: 'sports' },
  { slug: 'crypto', labelKey: 'crypto' as const, tagSlug: 'crypto' },
  { slug: 'esports', labelKey: 'esports' as const, tagSlug: 'esports' },
  { slug: 'finance', labelKey: 'finance' as const, tagSlug: 'finance' },
  { slug: 'geopolitics', labelKey: 'geopolitics' as const, tagSlug: 'geopolitics' },
  { slug: 'tech', labelKey: 'tech' as const, tagSlug: 'science' },
  { slug: 'culture', labelKey: 'culture' as const, tagSlug: 'pop-culture' },
  { slug: 'economy', labelKey: 'economy' as const, tagSlug: 'economy' },
  { slug: 'weather', labelKey: 'weather' as const, tagSlug: 'weather' },
  { slug: 'elections', labelKey: 'elections' as const, tagSlug: 'elections' },
] as const;

export type NavSlug =
  | (typeof FEATURED_NAV)[number]['slug']
  | (typeof CATEGORY_NAV)[number]['slug'];

export function tagSlugForNav(slug: string): string | undefined {
  const cat = CATEGORY_NAV.find((c) => c.slug === slug);
  return cat?.tagSlug;
}
