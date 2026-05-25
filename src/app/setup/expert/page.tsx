import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { PageShell } from '@/components/ui/page-shell';
import { ExpertSetupForm } from '@/components/expert-setup-form';

export default async function ExpertSetupPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/connect');

  // تأكد إن المستخدم مشترك في Expert role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, isSetupComplete: true },
  });

  // لو مش Expert أو خلص الإعداد → Dashboard
  if (!user || user.role !== 'expert' || user.isSetupComplete) {
    redirect('/dashboard');
  }

  return (
    <PageShell showCategoryNav={false}>
      <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4">
        <ExpertSetupForm userId={session.user.id} />
      </main>
    </PageShell>
  );
}