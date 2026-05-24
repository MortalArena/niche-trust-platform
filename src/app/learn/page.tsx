import { DocsShell } from '@/components/learn/docs-shell';
import { getLearnDoc } from '@/lib/learn/docs';

export const dynamic = 'force-dynamic';

export default function LearnHomePage() {
  const doc = getLearnDoc('');
  if (!doc) {
    throw new Error('Learn overview document missing');
  }
  return <DocsShell doc={doc} />;
}
