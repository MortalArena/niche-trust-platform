import { notFound } from 'next/navigation';
import { DocsShell } from '@/components/learn/docs-shell';
import { getLearnDoc } from '@/lib/learn/docs';

export const dynamic = 'force-dynamic';

export default async function LearnSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const doc = getLearnDoc(slug);
  if (!doc) notFound();
  return <DocsShell doc={doc} />;
}
