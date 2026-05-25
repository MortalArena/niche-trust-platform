'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface ExpertSetupFormProps {
  userId: string;
}

const SERVICE_OPTIONS = [
  { value: 'signals', label: '📡 Trading signals', desc: 'Buy/sell calls with entry/exit/stop' },
  { value: 'bots', label: '🤖 Trading bots & automation', desc: 'Sell or rent your trading bot or strategy' },
  { value: 'analysis', label: '📊 Market analysis & research', desc: 'In-depth market intel and reports' },
  { value: 'education', label: '🎓 Education & coaching', desc: 'Courses, mentoring, learning materials' },
  { value: 'copy-trading', label: '🔁 Copy trading', desc: 'Let others automatically copy your trades' },
];

const DEFAULT_PRICES = {
  signals: 49.99,
  bots: 199.99,
  analysis: 29.99,
  education: 99.99,
  'copy-trading': 79.99,
} as Record<string, number>;

export function ExpertSetupForm({ userId }: ExpertSetupFormProps) {
  const router = useRouter();
  const [expertHeadline, setExpertHeadline] = useState('');
  const [expertBio, setExpertBio] = useState('');
  const [serviceTypes, setServiceTypes] = useState<string[]>([]);
  const [defaultPrice, setDefaultPrice] = useState(49.99);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const toggleService = (val: string) => {
    setServiceTypes((prev) =>
      prev.includes(val) ? prev.filter((v) => v !== val) : [...prev, val]
    );
  };

  const handleSave = async () => {
    if (serviceTypes.length === 0) {
      setError('Select at least one service type');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const res = await fetch('/api/user/expert-setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertHeadline: expertHeadline.trim(),
          expertBio: expertBio.trim(),
          serviceTypes,
          defaultPrice,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save');
      }

      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setSaving(false);
    }
  };

  if (success) {
    return (
      <div className="w-full max-w-md text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
          <svg className="h-8 w-8 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">You're all set! 🎉</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Redirecting to your expert dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-700 shadow-lg shadow-blue-500/30">
          <svg className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">
          Set up your expert profile
        </h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This helps buyers understand what you offer. You can edit anytime.
        </p>
      </div>

      {/* Headline */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Your expert headline *
        </label>
        <input
          type="text"
          value={expertHeadline}
          onChange={(e) => setExpertHeadline(e.target.value)}
          placeholder="e.g., 5+ years crypto trader — SOL & memecoin specialist"
          maxLength={100}
          className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{expertHeadline.length}/100</p>
      </div>

      {/* Bio */}
      <div>
        <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Bio (optional)
        </label>
        <textarea
          value={expertBio}
          onChange={(e) => setExpertBio(e.target.value)}
          placeholder="Describe your expertise, strategy style, and what subscribers can expect..."
          rows={4}
          maxLength={500}
          className="w-full resize-none rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        />
        <p className="mt-1 text-right text-xs text-gray-400">{expertBio.length}/500</p>
      </div>

      {/* Service types */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          What do you sell? *
        </label>
        <div className="space-y-2">
          {SERVICE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => toggleService(opt.value)}
              className={`flex w-full items-start gap-3 rounded-xl border-2 p-3 text-left transition-all ${
                serviceTypes.includes(opt.value)
                  ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-900/20'
                  : 'border-gray-200 bg-white hover:border-gray-300 dark:border-gray-700 dark:bg-gray-800'
              }`}
            >
              <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 ${
                serviceTypes.includes(opt.value)
                  ? 'border-blue-500 bg-blue-600'
                  : 'border-gray-300 dark:border-gray-600'
              }`}>
                {serviceTypes.includes(opt.value) && (
                  <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Default price */}
      {serviceTypes.length > 0 && (
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Default monthly price (USDC)
          </label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm text-gray-500">$</span>
            <input
              type="number"
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(Number(e.target.value) || 0)}
              min={1}
              max={99999}
              step={0.01}
              className="w-full rounded-xl border border-gray-300 bg-white px-8 py-3 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            You can set different prices per group later. 5% platform fee applies.
          </p>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/50 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Save */}
      <button
        onClick={handleSave}
        disabled={saving || !expertHeadline.trim() || serviceTypes.length === 0}
        className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
      >
        {saving ? 'Saving...' : '🚀 Complete setup'}
      </button>
    </div>
  );
}