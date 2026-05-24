export type LearnBlock =
  | { type: 'p'; text: string }
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'ul'; items: string[] }
  | { type: 'ol'; items: string[] }
  | { type: 'code'; language?: string; code: string; filename?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'success'; title?: string; text: string }
  | { type: 'links'; items: { href: string; label: string }[] }
  | { type: 'hero'; title: string; description: string; ctaHref: string; ctaLabel: string }
  | { type: 'table'; headers: string[]; rows: string[][] }
  | { type: 'api-catalog' }
  | { type: 'agent-keys' };

export interface LearnDoc {
  slug: string;
  title: string;
  description: string;
  blocks: LearnBlock[];
}
