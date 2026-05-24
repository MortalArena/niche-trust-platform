import { redirect } from 'next/navigation';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin/auth';
import { PageShell } from '@/components/ui/page-shell';
import { AdminDashboard } from '@/components/admin-dashboard';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const admin = await requireAdmin();
  if (admin.error === 'unauthorized') redirect('/connect');
  if (admin.error === 'forbidden') {
    return (
      <PageShell showCategoryNav={false}>
        <div className="mx-auto max-w-lg py-20 text-center">
          <h1 className="text-xl font-bold text-[var(--text-primary)]">Admin access denied</h1>
          <p className="mt-2 text-[var(--text-secondary)]">
            Set your wallet in ADMIN_WALLET_ADDRESSES in .env and sign in again.
          </p>
          <Link href="/dashboard" className="mt-4 inline-block font-medium text-blue-600 hover:underline">
            Back to dashboard
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell showCategoryNav={false}>
      <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">Admin control panel</h1>
      <p className="mb-8 text-sm text-[var(--text-secondary)]">
        Manage platform revenue (5% fee), expert payouts, users, and integrations.
      </p>
      <AdminDashboard />
    </PageShell>
  );
}
