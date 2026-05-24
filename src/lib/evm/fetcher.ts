import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import {
  CHAINS,
  type ChainId,
  getChain,
  normalizeAddress,
} from '@/lib/chains/config';
import { classifyEvmTransaction } from '@/lib/evm/classify';

const ETHERSCAN_V2 = 'https://api.etherscan.io/v2/api';

interface EtherscanTx {
  hash: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  input: string;
  isError: string;
  txreceipt_status?: string;
}

export interface EvmFetchResult {
  walletAddress: string;
  chain: ChainId;
  fetched: number;
  stored: number;
  skipped: number;
}

export async function fetchEvmWalletTransactions(
  walletAddress: string,
  chainId: ChainId,
  limit = 300
): Promise<EvmFetchResult> {
  const chain = getChain(chainId);
  if (!chain || chain.family !== 'evm' || !chain.etherscanChainId) {
    throw new Error(`Unsupported EVM chain: ${chainId}`);
  }

  const apiKey = process.env.ETHERSCAN_API_KEY;
  if (!apiKey) {
    throw new Error(
      'ETHERSCAN_API_KEY is required for EVM wallet sync (Polygon, Ethereum, etc.)'
    );
  }

  const normalized = normalizeAddress(chainId, walletAddress);

  const wallet = await prisma.wallet.findUnique({
    where: { address_chain: { address: normalized, chain: chainId } },
  });

  if (!wallet) {
    throw new Error(`Wallet not linked: ${normalized} on ${chainId}`);
  }

  const url = new URL(ETHERSCAN_V2);
  url.searchParams.set('chainid', String(chain.etherscanChainId));
  url.searchParams.set('module', 'account');
  url.searchParams.set('action', 'txlist');
  url.searchParams.set('address', normalized);
  url.searchParams.set('startblock', '0');
  url.searchParams.set('endblock', '99999999');
  url.searchParams.set('page', '1');
  url.searchParams.set('offset', String(Math.min(limit, 500)));
  url.searchParams.set('sort', 'desc');
  url.searchParams.set('apikey', apiKey);

  const res = await fetch(url.toString());
  const json = (await res.json()) as {
    status: string;
    message: string;
    result: EtherscanTx[] | string;
  };

  if (json.status !== '1' || !Array.isArray(json.result)) {
    const msg = typeof json.result === 'string' ? json.result : json.message;
    if (msg?.includes('No transactions')) {
      return { walletAddress: normalized, chain: chainId, fetched: 0, stored: 0, skipped: 0 };
    }
    throw new Error(`Etherscan API error (${chainId}): ${msg}`);
  }

  let stored = 0;
  let skipped = 0;

  for (const tx of json.result) {
    if (tx.isError === '1') {
      skipped += 1;
      continue;
    }

    const existing = await prisma.cachedTransaction.findUnique({
      where: { walletId_signature: { walletId: wallet.id, signature: tx.hash } },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    const classified = classifyEvmTransaction(tx, normalized);

    await prisma.cachedTransaction.create({
      data: {
        walletId: wallet.id,
        signature: tx.hash,
        blockTime: parseInt(tx.timeStamp, 10),
        type: classified.type,
        tokenIn: classified.tokenIn,
        tokenOut: classified.tokenOut,
        amountIn: classified.amountIn,
        amountOut: classified.amountOut,
        rawData: tx as unknown as object,
      },
    });
    stored += 1;
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: { lastSyncedAt: new Date(), signatureCount: { increment: stored } },
  });

  logger.info({ chain: chainId, wallet: normalized, stored }, 'EVM transactions synced');

  return {
    walletAddress: normalized,
    chain: chainId,
    fetched: json.result.length,
    stored,
    skipped,
  };
}

export function getSupportedEvmChains(): ChainId[] {
  return (Object.keys(CHAINS) as ChainId[]).filter(
    (id) => CHAINS[id].family === 'evm'
  );
}
