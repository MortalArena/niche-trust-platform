import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageShell } from '@/components/ui/page-shell';
import { PrivacySetup } from '@/components/privacy-setup';

export default async function SetupPage() {
  const session = await auth();
  
  // لو مش مسجل، ارجع للـ connect
  if (!session?.user?.id) {
    redirect('/connect');
  }

  return (
    <PageShell showCategoryNav={false}>
      <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4">
        <PrivacySetup userId={session.user.id} />
      </main>
    </PageShell>
  );
}