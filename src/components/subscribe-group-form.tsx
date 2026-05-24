'use client';

import { useEffect, useState } from 'react';
import { PERFORMANCE_CHAINS, CHAINS, type ChainId } from '@/lib/chains/config';

interface SubscribeGroupFormProps {
  groupId: string;
  monthlyPrice: number;
  yearlyPrice: number | null;
}

interface PaymentInstructions {
  platformWallet: string;
  amountUsd: number;
  platformFeeUsd: number;
  expertNetUsd: number;
  platformFeePercent: number;
  paymentReference: string;
  paymentChain: string;
  steps: string[];
}

export function SubscribeGroupForm({ groupId, monthlyPrice, yearlyPrice }: SubscribeGroupFormProps) {
  const [cycle, setCycle] = useState<'monthly' | 'yearly' | 'lifetime'>('monthly');
  const [paymentTxSig, setPaymentTxSig] = useState('');
  const [paymentChain, setPaymentChain] = useState<ChainId>('polygon');
  const [matrixUserId, setMatrixUserId] = useState('');
  const [instructions, setInstructions] = useState<PaymentInstructions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/groups/${groupId}/payment-instructions?cycle=${cycle}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.platformWallet) setInstructions(d);
      })
      .catch(() => setInstructions(null));
  }, [groupId, cycle]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (matrixUserId.trim()) {
        const matrixRes = await fetch('/api/user/matrix', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ matrixUserId: matrixUserId.trim() }),
        });
        if (!matrixRes.ok) {
          const d = await matrixRes.json();
          setError(d.error ?? 'Invalid Matrix ID');
          setLoading(false);
          return;
        }
      }

      const res = await fetch(`/api/groups/${groupId}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentTxSig: paymentTxSig.trim(),
          paymentChain,
          cycle,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Subscription failed');
        return;
      }

      window.location.reload();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubscribe} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="font-semibold text-white">Subscribe</h3>

      <div className="flex gap-2">
        {(['monthly', 'yearly', 'lifetime'] as const).map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCycle(c)}
            className={`rounded px-3 py-1 text-xs capitalize ${
              cycle === c ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-300'
            }`}
          >
            {c}
            {c === 'monthly' ? ` $${monthlyPrice}` : c === 'yearly' && yearlyPrice ? ` $${yearlyPrice}` : ''}
          </button>
        ))}
      </div>

      {instructions ? (
        <div className="rounded-lg border border-emerald-900 bg-emerald-950/40 p-4 text-sm">
          <p className="font-medium text-emerald-200">Pay platform wallet (5% fee auto-deducted)</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-zinc-300">
            <li>
              Send <strong className="text-white">${instructions.amountUsd}</strong> to:{' '}
              <code className="break-all text-xs text-emerald-300">{instructions.platformWallet}</code>
            </li>
            <li>
              Platform fee ({instructions.platformFeePercent}%):{' '}
              <span className="text-white">${instructions.platformFeeUsd}</span> → your wallet
            </li>
            <li>
              Expert share: <span className="text-white">${instructions.expertNetUsd}</span>
            </li>
            <li>
              Memo: <code className="text-xs text-violet-300">{instructions.paymentReference}</code>
            </li>
          </ul>
        </div>
      ) : (
        <p className="text-sm text-amber-300">
          Platform wallet not configured. Admin must set PLATFORM_WALLET_POLYGON in .env
        </p>
      )}

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Payment chain</label>
        <select
          value={paymentChain}
          onChange={(e) => setPaymentChain(e.target.value as ChainId)}
          className="w-full rounded-lg border border-zinc-600 px-3 py-2 text-sm text-white"
        >
          {PERFORMANCE_CHAINS.map((c) => (
            <option key={c} value={c}>
              {CHAINS[c].name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Transaction hash (after payment)</label>
        <input
          value={paymentTxSig}
          onChange={(e) => setPaymentTxSig(e.target.value)}
          required
          placeholder="0x... or Solana signature"
          className="w-full rounded-lg border border-zinc-600 px-3 py-2 font-mono text-xs text-white"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm text-zinc-400">Matrix ID (optional)</label>
        <input
          value={matrixUserId}
          onChange={(e) => setMatrixUserId(e.target.value)}
          placeholder="@username:localhost"
          className="w-full rounded-lg border border-zinc-600 px-3 py-2 text-sm text-white"
        />
      </div>

      <button
        type="submit"
        disabled={loading || !instructions}
        className="w-full rounded-lg bg-violet-600 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? 'Verifying payment...' : 'Confirm subscription'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
