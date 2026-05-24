import { Queue, Worker } from 'bullmq';
import { getRedisConnection } from '@/lib/queue/redis';
import type { ChainId } from '@/lib/chains/config';
import { syncAndAnalyzeWallet } from '@/lib/wallet/analyze-wallet';
import { logger } from '@/lib/logger';

const QUEUE_NAME = 'wallet-sync';

export function getWalletSyncQueue(): Queue | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  return new Queue(QUEUE_NAME, { connection });
}

export async function enqueueWalletSync(
  userId: string,
  walletAddress: string,
  chain: ChainId = 'polygon'
): Promise<string | null> {
  const queue = getWalletSyncQueue();
  if (!queue) return null;

  const job = await queue.add(
    'sync-analyze',
    { userId, walletAddress, chain },
    {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    }
  );

  return job.id ?? null;
}

export function startWalletSyncWorker(): Worker | null {
  const connection = getRedisConnection();
  if (!connection) return null;

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { userId, walletAddress, chain } = job.data as {
        userId: string;
        walletAddress: string;
        chain: ChainId;
      };
      logger.info({ userId, walletAddress, chain, jobId: job.id }, 'Processing wallet sync');
      return syncAndAnalyzeWallet(userId, walletAddress, chain ?? 'polygon');
    },
    {
      connection,
      concurrency: 2,
      limiter: { max: 5, duration: 60_000 },
    }
  );

  worker.on('failed', (job, err) => {
    logger.error({ jobId: job?.id, error: err.message }, 'Wallet sync job failed');
  });

  return worker;
}
