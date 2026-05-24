import type { ChainId } from '@/lib/chains/config';
import { CHAINS } from '@/lib/chains/config';
import { fetchEvmWalletTransactions } from '@/lib/evm/fetcher';
import { fetchWalletTransactions } from '@/lib/solana/fetcher';

export interface SyncResult {
  chain: ChainId;
  walletAddress: string;
  fetched: number;
  stored: number;
  skipped: number;
}

export async function syncWalletByChain(
  walletAddress: string,
  chain: ChainId,
  limit = 300
): Promise<SyncResult> {
  const config = CHAINS[chain];

  if (config.family === 'solana') {
    const r = await fetchWalletTransactions(walletAddress, limit);
    return { ...r, chain };
  }

  const r = await fetchEvmWalletTransactions(walletAddress, chain, limit);
  return { ...r };
}
