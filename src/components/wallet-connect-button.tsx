'use client';

import { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import { signIn } from 'next-auth/react';
import bs58 from 'bs58';
import { buildSignInMessage } from '@/lib/wallets/message';
import type { ChainId } from '@/lib/chains/config';
import { CHAINS, PERFORMANCE_CHAINS } from '@/lib/chains/config';
import { getInjectedEthereum, hasInjectedWallet } from '@/lib/ethereum/detect';

export function WalletConnectButton() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evmChain, setEvmChain] = useState<ChainId>('polygon');
  const [mode, setMode] = useState<'evm' | 'solana'>('evm');
  const [hasEvm, setHasEvm] = useState(false);

  useEffect(() => {
    setHasEvm(hasInjectedWallet());
  }, []);

  const signInEvm = async () => {
    const eth = getInjectedEthereum();
    if (!eth) {
      setError('No browser wallet found. Install MetaMask extension and refresh this page.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts[0]) {
        setError('No account selected in wallet');
        return;
      }
      const message = buildSignInMessage();
      const signature = (await eth.request({
        method: 'personal_sign',
        params: [message, accounts[0]],
      })) as string;

      const result = await signIn('evm', {
        publicKey: accounts[0],
        signature,
        message,
        chain: evmChain,
        redirect: false,
      });

      if (result?.error) {
        setError(`Sign-in failed: ${result.error}. Is the database running?`);
        return;
      }
      window.location.href = '/dashboard';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in cancelled';
      setError(msg.includes('reject') ? 'You rejected the signature in your wallet' : msg);
    } finally {
      setLoading(false);
    }
  };

  const signInSolana = async () => {
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const message = buildSignInMessage();
      const signature = await signMessage(new TextEncoder().encode(message));
      const result = await signIn('solana', {
        publicKey: publicKey.toBase58(),
        signature: bs58.encode(signature),
        message,
        chain: 'solana',
        redirect: false,
      });
      if (result?.error) {
        setError(`Sign-in failed: ${result.error}`);
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Solana sign-in cancelled or failed');
    } finally {
      setLoading(false);
    }
  };

  const signInDev = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await signIn('dev', { redirect: false });
      if (result?.error) {
        setError('Demo login failed. Run: pnpm docker:up && pnpm db:push');
        return;
      }
      window.location.href = '/dashboard';
    } catch {
      setError('Demo login failed — is Postgres running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full max-w-md flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode('evm')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            mode === 'evm' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-200'
          }`}
        >
          EVM (Polymarket)
        </button>
        <button
          type="button"
          onClick={() => setMode('solana')}
          className={`rounded px-3 py-1.5 text-sm font-medium ${
            mode === 'solana' ? 'bg-violet-600 text-white' : 'bg-zinc-800 text-zinc-200'
          }`}
        >
          Solana
        </button>
      </div>

      {mode === 'evm' ? (
        <>
          <p className="text-center text-sm text-zinc-300">
            Recommended: <strong className="text-white">Polygon</strong> — Polymarket trading chain.
          </p>

          {!hasEvm && (
            <div className="w-full rounded-lg border border-amber-800 bg-amber-950/50 p-3 text-sm text-amber-200">
              <p className="font-medium">Wallet extension not detected</p>
              <p className="mt-1 text-amber-300/90">
                Install{' '}
                <a
                  href="https://metamask.io/download/"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  MetaMask
                </a>
                , enable it, then refresh this page.
              </p>
            </div>
          )}

          <label className="w-full text-left text-xs text-zinc-400">Network for sign-in</label>
          <select
            value={evmChain}
            onChange={(e) => setEvmChain(e.target.value as ChainId)}
            className="w-full rounded-lg border border-zinc-600 px-3 py-2.5 text-sm text-white"
          >
            {PERFORMANCE_CHAINS.filter((c) => CHAINS[c].family === 'evm').map((c) => (
              <option key={c} value={c}>
                {CHAINS[c].name}
                {CHAINS[c].isPolymarketTrading ? ' (Polymarket)' : ''}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={signInEvm}
            disabled={loading || !hasEvm}
            className="w-full rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading ? 'Verifying...' : 'Connect EVM wallet'}
          </button>
        </>
      ) : (
        <>
          <p className="text-center text-sm text-zinc-300">
            Use Phantom or Solflare for Solana Memo attestation only.
          </p>
          {!connected ? (
            <button
              type="button"
              onClick={() => setVisible(true)}
              className="w-full rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700"
            >
              Select Solana wallet
            </button>
          ) : (
            <>
              <p className="font-mono text-sm text-zinc-300">
                {publicKey?.toBase58().slice(0, 8)}...
                {publicKey?.toBase58().slice(-8)}
              </p>
              <button
                type="button"
                onClick={signInSolana}
                disabled={loading}
                className="w-full rounded-lg bg-violet-600 px-6 py-3 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
              >
                {loading ? 'Verifying...' : 'Sign in with Solana'}
              </button>
              <button
                type="button"
                onClick={() => disconnect()}
                className="text-sm text-zinc-400 hover:text-zinc-200"
              >
                Disconnect
              </button>
            </>
          )}
        </>
      )}

      {error && (
        <p className="w-full rounded-lg border border-red-900 bg-red-950 p-3 text-sm text-red-300">
          {error}
        </p>
      )}

      {process.env.NODE_ENV !== 'production' && (
        <div className="w-full border-t border-zinc-800 pt-4">
          <p className="mb-2 text-center text-xs text-zinc-500">
            Development only — no wallet required
          </p>
          <button
            type="button"
            onClick={signInDev}
            disabled={loading}
            className="w-full rounded-lg border border-zinc-600 py-2 text-sm text-zinc-300 hover:bg-zinc-800"
          >
            Continue as demo user
          </button>
        </div>
      )}
    </div>
  );
}
