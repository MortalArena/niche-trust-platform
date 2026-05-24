import {
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { rpcPool } from '@/lib/solana/rpc-pool';
import { logger } from '@/lib/logger';

export const MEMO_PROGRAM_ID = new PublicKey('MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr');

export function getMemoKeypair(): Keypair | null {
  const secret = process.env.MEMO_SIGNER_SECRET?.trim();
  if (!secret) return null;

  try {
    const decoded = Buffer.from(secret, 'base64');
    return Keypair.fromSecretKey(decoded);
  } catch {
    logger.error('Invalid MEMO_SIGNER_SECRET format (expected base64 secret key)');
    return null;
  }
}

/**
 * يسجل hash على Solana عبر Memo Program (~0.000005 SOL)
 */
export async function writeHashOnChain(contentHash: string): Promise<string> {
  const keypair = getMemoKeypair();
  if (!keypair) {
    throw new Error('MEMO_SIGNER_SECRET not configured');
  }

  const memoText = `niche:v1:${contentHash}`;

  return rpcPool.call(async (connection) => {
    const instruction = new TransactionInstruction({
      keys: [{ pubkey: keypair.publicKey, isSigner: true, isWritable: true }],
      programId: MEMO_PROGRAM_ID,
      data: Buffer.from(memoText, 'utf-8'),
    });

    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash('confirmed');
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = keypair.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [keypair], {
      commitment: 'confirmed',
    });

    logger.info({ contentHash, signature }, 'Hash written on-chain');
    return signature;
  });
}

export async function verifyHashOnChain(signature: string): Promise<boolean> {
  try {
    const tx = await rpcPool.call((conn) =>
      conn.getParsedTransaction(signature, { maxSupportedTransactionVersion: 0 })
    );
    return tx !== null && tx.meta?.err == null;
  } catch {
    return false;
  }
}

/** إعادة محاولة التوقعات المعلقة */
export async function retryPendingMemos(limit = 20): Promise<number> {
  const { prisma } = await import('@/lib/db');
  const pending = await prisma.prediction.findMany({
    where: { onChainStatus: 'pending' },
    take: limit,
    orderBy: { createdAt: 'asc' },
  });

  let success = 0;
  const keypair = getMemoKeypair();
  if (!keypair) return 0;

  for (const pred of pending) {
    try {
      const sig = await writeHashOnChain(pred.contentHash);
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { solanaTxSig: sig, onChainStatus: 'confirmed' },
      });
      success += 1;
    } catch (error) {
      logger.error({ predictionId: pred.id, error }, 'Memo retry failed');
      await prisma.prediction.update({
        where: { id: pred.id },
        data: { onChainStatus: 'failed' },
      });
    }
  }

  return success;
}
