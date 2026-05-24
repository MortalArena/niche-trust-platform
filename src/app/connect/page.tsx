import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { PageShell } from '@/components/ui/page-shell';
import { ConnectButtons } from '@/components/connect-buttons';

export default async function ConnectPage() {
  const session = await auth();
  if (session?.user) {
    // أول تسجيل؟ روح لإعدادات الخصوصية
    return redirect('/setup');
  }

  return (
    <PageShell showCategoryNav={false}>
      <main className="mx-auto flex min-h-[80vh] max-w-lg flex-col items-center justify-center px-4">
        {/* الشعار */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
            <span className="text-3xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
            Welcome to <span className="text-violet-600 dark:text-violet-400">Niche</span>
          </h1>
          <p className="max-w-sm text-center text-sm text-gray-500 dark:text-gray-400">
            The private intelligence network for traders. 
            Verify performance, share signals, and build reputation — with privacy.
          </p>
        </div>

        {/* أزرار التسجيل */}
        <div className="w-full space-y-3">
          <ConnectButtons />
        </div>

        {/* Footer */}
        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          By continuing, you agree to our{' '}
          <a href="/terms" className="underline hover:text-gray-600 dark:hover:text-gray-300">Terms</a>
          {' '}and{' '}
          <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>
        </p>
      </main>
    </PageShell>
  );
}