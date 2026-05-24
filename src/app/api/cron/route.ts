import { NextResponse } from 'next/server';
import { retryPendingMemos } from '@/lib/solana/memo';
import { expireAllDueSubscriptions } from '@/lib/subscriptions/manager';
import { prisma } from '@/lib/db';
import type { ChainId } from '@/lib/chains/config';
import { syncAndAnalyzeWallet } from '@/lib/wallet/analyze-wallet';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const task = new URL(req.url).searchParams.get('task');
  const results: Record<string, number | string> = {};

  try {
    if (!task || task === 'expire-subscriptions') {
      results.expiredSubscriptions = await expireAllDueSubscriptions();
    }

    if (!task || task === 'retry-memos') {
      results.retriedMemos = await retryPendingMemos(20);
    }

    if (task === 'sync-active-wallets') {
      const stale = await prisma.wallet.findMany({
        where: {
          OR: [
            { lastSyncedAt: null },
            { lastSyncedAt: { lt: new Date(Date.now() - 6 * 60 * 60 * 1000) } },
          ],
        },
        take: 10,
        include: { user: true },
      });

      let synced = 0;
      for (const w of stale) {
        try {
          await syncAndAnalyzeWallet(w.userId, w.address, w.chain as ChainId, {
            syncLimit: 200,
          });
          synced += 1;
        } catch (error) {
          logger.error({ wallet: w.address, error }, 'Cron wallet sync failed');
        }
      }
      results.syncedWallets = synced;
    }

    return NextResponse.json({ ok: true, results });
  } catch (error) {
    logger.error({ error }, 'Cron task failed');
    return NextResponse.json({ error: 'Cron failed' }, { status: 500 });
  }
}
