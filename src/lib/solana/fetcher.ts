import { PublicKey } from '@solana/web3.js';
import { prisma } from '@/lib/db';
import { logger } from '@/lib/logger';
import { rpcPool } from '@/lib/solana/rpc-pool';
import { classifyParsedTransaction } from '@/lib/solana/classify';

const DEFAULT_LIMIT = 500;
const BATCH_DELAY_MS = 100;

export interface FetchResult {
  walletAddress: string;
  fetched: number;
  stored: number;
  skipped: number;
}

export async function fetchWalletTransactions(
  walletAddress: string,
  limit = DEFAULT_LIMIT
): Promise<FetchResult> {
  const publicKey = new PublicKey(walletAddress);

  let wallet = await prisma.wallet.findUnique({
    where: { address_chain: { address: walletAddress, chain: 'solana' } },
  });

  if (!wallet) {
    throw new Error(`Wallet not found: ${walletAddress}`);
  }

  const signatures = await rpcPool.call((conn) =>
    conn.getSignaturesForAddress(publicKey, { limit })
  );

  logger.info({ wallet: walletAddress, count: signatures.length }, 'Fetched signatures');

  let stored = 0;
  let skipped = 0;

  for (const sigInfo of signatures) {
    const existing = await prisma.cachedTransaction.findUnique({
      where: { walletId_signature: { walletId: wallet.id, signature: sigInfo.signature } },
    });

    if (existing) {
      skipped += 1;
      continue;
    }

    try {
      const tx = await rpcPool.call((conn) =>
        conn.getParsedTransaction(sigInfo.signature, {
          maxSupportedTransactionVersion: 0,
        })
      );

      if (!tx) {
        skipped += 1;
        continue;
      }

      const classification = classifyParsedTransaction(tx);

      await prisma.cachedTransaction.create({
        data: {
          signature: sigInfo.signature,
          walletId: wallet.id,
          blockTime: sigInfo.blockTime ?? tx.blockTime ?? 0,
          type: classification.type,
          tokenIn: classification.tokenIn,
          tokenOut: classification.tokenOut,
          amountIn: classification.amountIn,
          amountOut: classification.amountOut,
          rawData: JSON.parse(JSON.stringify(tx)),
        },
      });

      stored += 1;
      await sleep(BATCH_DELAY_MS);
    } catch (error) {
      logger.error({ signature: sigInfo.signature, error }, 'Failed to process transaction');
    }
  }

  await prisma.wallet.update({
    where: { id: wallet.id },
    data: {
      lastSyncedAt: new Date(),
      signatureCount: signatures.length,
    },
  });

  return {
    walletAddress,
    fetched: signatures.length,
    stored,
    skipped,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
