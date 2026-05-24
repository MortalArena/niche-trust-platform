'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AnalyzeWalletButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/wallet/analyze', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'فشل التحليل');
        return;
      }
      router.refresh();
    } catch {
      setError('خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleAnalyze}
        disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? 'جاري التحليل...' : 'تحليل المحفظة'}
      </button>
      {error && <p className="mt-2 text-sm text-red-400">{error}</p>}
    </div>
  );
}
