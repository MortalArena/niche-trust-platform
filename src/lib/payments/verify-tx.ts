import type { ChainId } from '@/lib/chains/config';
import { CHAINS } from '@/lib/chains/config';
import { rpcPool } from '@/lib/solana/rpc-pool';

export async function verifyPaymentTransaction(
  signature: string,
  chain: ChainId
): Promise<boolean> {
  const config = CHAINS[chain];
  if (!config) return false;

  if (config.family === 'solana') {
    try {
      const tx = await rpcPool.call((conn) =>
        conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })
      );
      return tx !== null && tx.meta?.err == null;
    } catch {
      return false;
    }
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey || !config.etherscanChainId) return false;

  const url = new URL('https://api.etherscan.io/v2/api');
  url.searchParams.set('chainid', String(config.etherscanChainId));
  url.searchParams.set('module', 'proxy');
  url.searchParams.set('action', 'eth_getTransactionByHash');
  url.searchParams.set('txhash', signature);
  url.searchParams.set('apikey', apiKey);

  try {
    const res = await fetch(url.toString());
    const json = (await res.json()) as { result?: { hash?: string } | null };
    return Boolean(json.result?.hash);
  } catch {
    return false;
  }
}
