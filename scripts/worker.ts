import { startWalletSyncWorker } from '../src/lib/queue/wallet-sync';
import { logger } from '../src/lib/logger';

async function main() {
  logger.info('Starting BullMQ wallet sync worker...');
  startWalletSyncWorker();
  logger.info('Worker running. Press Ctrl+C to stop.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
