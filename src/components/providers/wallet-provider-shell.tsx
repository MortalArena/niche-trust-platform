'use client';

import dynamic from 'next/dynamic';
import type { ReactNode } from 'react';

const SolanaWalletProvider = dynamic(
  () =>
    import('@/components/providers/wallet-provider').then((m) => m.SolanaWalletProvider),
  { ssr: false }
);

export function SolanaWalletProviderShell({ children }: { children: ReactNode }) {
  return <SolanaWalletProvider>{children}</SolanaWalletProvider>;
}
