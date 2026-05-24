import { redirect } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/auth';
import { PredictionForm } from '@/components/prediction-form';
import { PageShell } from '@/components/ui/page-shell';

export default async function PublishPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connect');

  return (
    <PageShell showCategoryNav={false}>
      <div className="mx-auto max-w-lg">
        <h1 className="mb-4 text-2xl font-bold text-[var(--text-primary)]">Publish prediction</h1>
        <p className="mb-4 text-sm text-[var(--text-secondary)]">
          Content is encrypted client-side. Only the SHA-256 hash is written to{' '}
          <strong className="text-[var(--text-primary)]">Solana Memo</strong> — not your full text.
        </p>
        <PredictionForm />
        <Link href="/dashboard" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Dashboard
        </Link>
      </div>
    </PageShell>
  );
}
