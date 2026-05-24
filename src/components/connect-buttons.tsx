'use client';

import { useEffect, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import bs58 from 'bs58';
import { buildSignInMessage } from '@/lib/wallets/message';
import type { ChainId } from '@/lib/chains/config';
import { CHAINS, PERFORMANCE_CHAINS } from '@/lib/chains/config';
import { getInjectedEthereum, hasInjectedWallet } from '@/lib/ethereum/detect';

export function ConnectButtons() {
  const { publicKey, signMessage, connected, disconnect } = useWallet();
  const { setVisible } = useWalletModal();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasEvm, setHasEvm] = useState(false);
  const [evmChain, setEvmChain] = useState<ChainId>('polygon');
  const [showWalletOptions, setShowWalletOptions] = useState(false);

  useEffect(() => {
    setHasEvm(hasInjectedWallet());
  }, []);

  // Google Sign-In
  const handleGoogleSignIn = async () => {
    setLoading('google');
    setError(null);
    try {
      await signIn('google', { callbackUrl: '/setup' });
    } catch {
      setError('Google sign-in failed. Try another method.');
    } finally {
      setLoading(null);
    }
  };

  // GitHub Sign-In
  const handleGitHubSignIn = async () => {
    setLoading('github');
    setError(null);
    try {
      await signIn('github', { callbackUrl: '/setup' });
    } catch {
      setError('GitHub sign-in failed. Try another method.');
    } finally {
      setLoading(null);
    }
  };

  // EVM Sign-In
  const handleEvmSignIn = async () => {
    setLoading('evm');
    setError(null);
    const eth = getInjectedEthereum();
    if (!eth) {
      setError('No browser wallet found. Install MetaMask or another EVM wallet.');
      setLoading(null);
      return;
    }
    try {
      const accounts = (await eth.request({ method: 'eth_requestAccounts' })) as string[];
      if (!accounts[0]) throw new Error('No account selected');
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
      if (result?.error) throw new Error(result.error);
      window.location.href = '/setup';
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Sign-in cancelled';
      setError(msg.includes('reject') ? 'You rejected the signature' : msg);
    } finally {
      setLoading(null);
    }
  };

  // Solana Sign-In
  const handleSolanaSignIn = async () => {
    if (!publicKey || !signMessage) {
      setVisible(true);
      return;
    }
    setLoading('solana');
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
      if (result?.error) throw new Error(result.error);
      window.location.href = '/setup';
    } catch {
      setError('Solana sign-in failed or was cancelled.');
    } finally {
      setLoading(null);
    }
  };

  // Demo Sign-In
  const handleDemoSignIn = async () => {
    setLoading('demo');
    setError(null);
    try {
      const result = await signIn('dev', { redirect: false });
      if (result?.error) throw new Error(result.error);
      window.location.href = '/setup';
    } catch {
      setError('Demo login failed. Make sure Postgres is running.');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="w-full space-y-3">
      {/* Google */}
      <button
        onClick={handleGoogleSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        {loading === 'google' ? 'Connecting...' : 'Continue with Google'}
      </button>

      {/* GitHub */}
      <button
        onClick={handleGitHubSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
        </svg>
        {loading === 'github' ? 'Connecting...' : 'Continue with GitHub'}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3 py-2">
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
        <span className="text-xs text-gray-400">or continue with crypto wallet</span>
        <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
      </div>

      {/* Wallet - EVM */}
      <button
        onClick={handleEvmSignIn}
        disabled={loading !== null}
        className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
      >
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#627EEA">
          <path d="M12 0C5.37 0 0 5.37 0 12s5.37 12 12 12 12-5.37 12-12S18.63 0 12 0z"/>
          <path d="M11.99 4.5l-5.5 8.25 5.5-2.43V4.5zM11.99 10.32l5.5 2.43-5.5-8.25v5.82zM6.49 13.75l5.5 3.25v-5.68l-5.5 2.43zM11.99 11.32v5.68l5.5-3.25-5.5-2.43z" fill="white"/>
        </svg>
        {loading === 'evm' ? 'Connecting...' : 'Connect EVM Wallet (MetaMask)'}
      </button>

      {/* Wallet - Solana */}
      {!connected ? (
        <button
          onClick={() => setVisible(true)}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all hover:bg-gray-50 hover:shadow-md disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#9945FF">
            <circle cx="12" cy="12" r="12"/>
            <path d="M7.5 15.5L12 8l4.5 7.5H7.5z" fill="white" transform="rotate(180 12 12)"/>
          </svg>
          Connect Solana Wallet (Phantom)
        </button>
      ) : (
        <button
          onClick={handleSolanaSignIn}
          disabled={loading !== null}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-violet-200 bg-violet-50 px-6 py-3 text-sm font-medium text-violet-700 shadow-sm transition-all hover:bg-violet-100 hover:shadow-md disabled:opacity-50 dark:border-violet-800 dark:bg-violet-900/30 dark:text-violet-300 dark:hover:bg-violet-900/50"
        >
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span>{publicKey?.toBase58().slice(0, 6)}...{publicKey?.toBase58().slice(-4)}</span>
          </div>
          {loading === 'solana' ? 'Connecting...' : 'Sign in with Solana'}
        </button>
      )}

      {/* Network selector for EVM */}
      {showWalletOptions && (
        <select
          value={evmChain}
          onChange={(e) => setEvmChain(e.target.value as ChainId)}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
        >
          {PERFORMANCE_CHAINS.filter((c) => CHAINS[c].family === 'evm').map((c) => (
            <option key={c} value={c}>{CHAINS[c].name}</option>
          ))}
        </select>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Demo (Dev only) */}
      {process.env.NODE_ENV !== 'production' && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
            <span className="text-xs text-gray-400">Development</span>
            <div className="flex-1 border-t border-gray-200 dark:border-gray-700" />
          </div>
          <button
            onClick={handleDemoSignIn}
            disabled={loading !== null}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-6 py-3 text-sm text-gray-500 transition-all hover:bg-gray-100 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800/50 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            {loading === 'demo' ? 'Loading...' : 'Continue as Demo (No wallet required)'}
          </button>
        </>
      )}
    </div>
  );
}