'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface PrivacySetupProps {
  userId: string;
}

export function PrivacySetup({ userId }: PrivacySetupProps) {
  const router = useRouter();
  const [step, setStep] = useState<'choose' | 'name' | 'role'>('choose');
  const [privacy, setPrivacy] = useState<'public' | 'anonymous' | null>(null);
  const [role, setRole] = useState<'expert' | 'subscriber' | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    if (!role || !privacy) return;
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isAnonymous: privacy === 'anonymous',
          displayName: displayName.trim() || undefined,
          role,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      // لو خبير → روح لصفحة إعدادات الخبير
      if (role === 'expert') {
        router.push('/setup/expert');
      } else {
        router.push('/dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (step === 'choose') {
    return (
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            Choose your profile type
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            This can be changed later. Your data is always encrypted — this controls what others see.
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {/* Public */}
          <button
            onClick={() => { setPrivacy('public'); setStep('name'); }}
            className="group w-full rounded-2xl border-2 border-transparent bg-white p-5 text-left shadow-sm transition-all hover:border-violet-300 hover:shadow-md dark:bg-gray-800 dark:hover:border-violet-600"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-900/50">
                <svg className="h-6 w-6 text-violet-600 dark:text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Public Profile</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your name, photo, and reputation score are visible to everyone. 
                  Best for building trust and attracting subscribers.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">Trust score visible</span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/50 dark:text-green-400">Earn subscribers</span>
                </div>
              </div>
            </div>
          </button>

          {/* Anonymous */}
          <button
            onClick={() => { setPrivacy('anonymous'); setStep('name'); }}
            className="group w-full rounded-2xl border-2 border-transparent bg-white p-5 text-left shadow-sm transition-all hover:border-amber-300 hover:shadow-md dark:bg-gray-800 dark:hover:border-amber-600"
          >
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 dark:bg-amber-900/50">
                <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">Anonymous</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Your real identity stays hidden. Your wallet activity and 
                  reputation score are still verifiable on-chain.
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">Identity hidden</span>
                  <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/50 dark:text-amber-400">Score still verified</span>
                </div>
              </div>
            </div>
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Your wallet transactions are always on-chain. We never share your personal data.
        </p>
      </div>
    );
  }

  // Step 2: Display Name
  if (step === 'name') {
    return (
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
            <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
            {privacy === 'anonymous' ? 'Choose your alias' : 'What should we call you?'}
          </h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {privacy === 'anonymous' 
              ? 'Pick a unique display name. Your real identity stays hidden.' 
              : 'This will be your public display name on your profile.'}
          </p>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder={
              privacy === 'anonymous' 
                ? 'e.g., ShadowTrader_42' 
                : 'e.g., Alex The Trader'
            }
            maxLength={30}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-violet-400"
            autoFocus
            onKeyDown={(e) => { if (e.key === 'Enter' && displayName.trim()) setStep('role'); }}
          />
          <p className="text-right text-xs text-gray-400">{displayName.length}/30</p>

          <button
            onClick={() => setStep('role')}
            disabled={!displayName.trim()}
            className="w-full rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/25 transition-all hover:from-violet-500 hover:to-purple-500 hover:shadow-xl disabled:opacity-50"
          >
            Continue →
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Choose Role (خبير ولا مشتري)
  return (
    <div className="w-full max-w-md space-y-8">
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-700 shadow-lg shadow-violet-500/30">
          <span className="text-2xl font-bold text-white">?</span>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          What brings you here?
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          You can switch roles later. This just helps us set up your dashboard.
        </p>
      </div>

      <div className="space-y-4">
        {/* Expert */}
        <button
          onClick={() => { setRole('expert'); handleSave(); }}
          disabled={saving}
          className="group w-full rounded-2xl border-2 border-transparent bg-white p-5 text-left shadow-sm transition-all hover:border-blue-500 hover:shadow-md disabled:opacity-50 dark:bg-gray-800 dark:hover:border-blue-500"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 dark:bg-blue-900/50">
              <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">🔥 I sell information</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                I have trading expertise, signals, strategies, or bots to sell. 
                I want to build reputation and earn from my knowledge.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">Sell signals</span>
                <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/50 dark:text-blue-400">Earn subscribers</span>
              </div>
            </div>
          </div>
        </button>

        {/* Subscriber */}
        <button
          onClick={() => { setRole('subscriber'); handleSave(); }}
          disabled={saving}
          className="group w-full rounded-2xl border-2 border-transparent bg-white p-5 text-left shadow-sm transition-all hover:border-emerald-500 hover:shadow-md disabled:opacity-50 dark:bg-gray-800 dark:hover:border-emerald-500"
        >
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-900/50">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">🔍 I buy information</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                I want to follow top traders, access verified signals, 
                and pay for expert insights with complete transparency.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Follow experts</span>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400">Verified signals</span>
              </div>
            </div>
          </div>
        </button>
      </div>

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}
    </div>
  );
}