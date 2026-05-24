import { NextResponse, after } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { writeHashOnChain, getMemoKeypair } from '@/lib/solana/memo';
import { logger } from '@/lib/logger';

const publishSchema = z.object({
  encryptedPayload: z.string().min(1),
  nonce: z.string().min(1),
  contentHash: z.string().length(64),
  visibility: z.enum(['public', 'group', 'private']),
  groupId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = publishSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Invalid data', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { encryptedPayload, nonce, contentHash, visibility, groupId, expiresAt } =
    parsed.data;

  const hasMemoSigner = Boolean(getMemoKeypair());

  const prediction = await prisma.prediction.create({
    data: {
      authorId: session.user.id,
      encryptedPayload,
      nonce,
      contentHash,
      visibility,
      groupId: groupId ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      onChainStatus: hasMemoSigner ? 'pending' : 'skipped',
    },
  });

  if (hasMemoSigner) {
    after(async () => {
      try {
        const signature = await writeHashOnChain(contentHash);
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { solanaTxSig: signature, onChainStatus: 'confirmed' },
        });
      } catch (error) {
        logger.error({ predictionId: prediction.id, error }, 'On-chain memo failed');
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { onChainStatus: 'pending' },
        });
      }
    });
  }

  return NextResponse.json({
    id: prediction.id,
    contentHash: prediction.contentHash,
    status: prediction.onChainStatus,
    verifyUrl: `/api/prediction/verify/${contentHash}`,
  });
}
