import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { CreateGroupForm } from '@/components/create-group-form';
import { PageShell } from '@/components/ui/page-shell';

export default async function NewGroupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connect');

  return (
    <PageShell showCategoryNav={false}>
      <div className="mx-auto max-w-xl">
        <h1 className="mb-6 text-2xl font-bold text-[var(--text-primary)]">Create expert group</h1>
        <CreateGroupForm />
        <Link href="/groups" className="mt-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Back to groups
        </Link>
      </div>
    </PageShell>
  );
}
