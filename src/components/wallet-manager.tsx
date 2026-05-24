'use client';

import { useCallback, useEffect, useState } from 'react';
import { PERFORMANCE_CHAINS, CHAINS, type ChainId } from '@/lib/chains/config';
import { buildSignInMessage } from '@/lib/wallets/message';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';

interface WalletRow {
  id: string;
  address: string;
  chain: string;
  chainName: string;
  isPrimary: boolean;
}

export function WalletManager() {
  const [wallets, setWallets] = useState<WalletRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [linkChain, setLinkChain] = useState<ChainId>('polygon');
  const [error, setError] = useState<string | null>(null);
  const { publicKey, signMessage } = useWallet();
  const { setVisible } = useWalletModal();

  const load = useCallback(async () => {
    const res = await fetch('/api/wallets');
    const data = await res.json();
    setWallets(data.wallets ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const linkSolana = async () => {
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }
    const message = buildSignInMessage();
    const sig = await signMessage(new TextEncoder().encode(message));
    await linkWallet('solana', publicKey.toBase58(), message, bs58.encode(sig));
  };

  const linkEvm = async () => {
    const eth = (window as { ethereum?: { request: (a: unknown) => Promise<unknown> } }).ethereum;
    if (!eth) {
      setError('Install MetaMask or another EVM wallet');
      return;
    }
    const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
    const address = accounts[0];
    const message = buildSignInMessage();
    const signature = (await eth.request({
      method: 'personal_sign',
      params: [message, address],
    })) as string;
    await linkWallet(linkChain, address, message, signature);
  };

  const linkWallet = async (
    chain: ChainId,
    address: string,
    message: string,
    signature: string
  ) => {
    setError(null);
    const res = await fetch('/api/wallets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chain, address, message, signature, setPrimary: wallets.length === 0 }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? 'Failed to link');
      return;
    }
    await load();
  };

  const remove = async (id: string) => {
    const res = await fetch(`/api/wallets/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  };

  if (loading) return <p className="text-sm text-[var(--text-muted)]">Loading wallets…</p>;

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="mb-2 text-lg font-semibold text-[var(--text-primary)]">Linked wallets</h2>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Polymarket trades on Polygon — link that wallet for trading history. Solana is only used
        to attest prediction hashes. Each chain is analyzed separately.
      </p>

      <ul className="mb-4 space-y-2">
        {wallets.map((w) => (
          <li
            key={w.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-2 text-sm"
          >
            <div>
              <span className="font-medium text-blue-600">{w.chainName}</span>
              <span className="ml-2 font-mono text-[var(--text-secondary)]">
                {w.address.slice(0, 8)}...{w.address.slice(-6)}
              </span>
              {w.isPrimary && (
                <span className="ml-2 rounded bg-blue-100 px-1.5 text-xs font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                  primary
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => remove(w.id)}
              className="text-xs font-medium text-red-600 hover:underline"
            >
              Remove
            </button>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <select
          value={linkChain}
          onChange={(e) => setLinkChain(e.target.value as ChainId)}
          className="rounded-lg border-2 border-[var(--border)] px-3 py-2 text-sm font-medium text-[var(--text-primary)]"
        >
          {PERFORMANCE_CHAINS.filter((c) => CHAINS[c].family === 'evm').map((c) => (
            <option key={c} value={c}>
              {CHAINS[c].name}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={linkEvm}
          className="rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          Link EVM wallet
        </button>
        <button
          type="button"
          onClick={linkSolana}
          className="rounded-lg border-2 border-[var(--border)] bg-[var(--surface)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-hover)]"
        >
          Link Solana wallet
        </button>
      </div>
      {error && <p className="mt-2 text-sm font-medium text-red-600">{error}</p>}
    </div>
  );
}
