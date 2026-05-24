import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { z } from 'zod';
import { writeHashOnChain } from '@/lib/solana/memo';

const publishSchema = z.object({
  // Core prediction data
  title: z.string().min(1).max(500),
  description: z.string().max(10000).optional(),
  category: z.enum(['price_action', 'binary', 'multiple_choice', 'numerical', 'polymarket', 'kalshi', 'stock', 'manual']).default('price_action'),

  // Price action / stock / numerical fields
  asset: z.string().optional(),
  entryPrice: z.number().positive().optional(),
  targetPrice: z.number().positive().optional(),
  stopLoss: z.number().positive().optional(),
  timeframe: z.string().optional(),

  // Binary / multiple choice fields
  question: z.string().optional(),
  predictedOutcome: z.string().optional(),

  // External platform linking
  externalUrl: z.string().url().optional(),
  externalMarketId: z.string().optional(),
  predictionSource: z.enum(['internal', 'polymarket', 'kalshi']).default('internal'),

  // E2EE fields (client-side encrypted payload)
  encryptedPayload: z.string(),
  nonce: z.string(),
  contentHash: z.string().length(64),

  // Visibility & access
  visibility: z.enum(['public', 'group', 'private']).default('group'),
  groupId: z.string().optional(),
  expiresAt: z.string().datetime().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = publishSchema.safeParse(body);
    
    if (!parsed.success) {
      return NextResponse.json({ 
        error: 'Invalid data', 
        details: parsed.error.flatten().fieldErrors 
      }, { status: 400 });
    }

    const data = parsed.data;

    // If group-specific, verify user is group owner or member
    if (data.groupId && data.visibility === 'group') {
      const group = await prisma.group.findUnique({
        where: { id: data.groupId },
        include: { members: { where: { userId: session.user.id } } },
      });
      
      if (!group || (group.ownerId !== session.user.id && group.members.length === 0)) {
        return NextResponse.json({ error: 'Not a member of this group' }, { status: 403 });
      }
    }

    // Create prediction
    const prediction = await prisma.prediction.create({
      data: {
        authorId: session.user.id,
        groupId: data.visibility === 'group' ? data.groupId : null,
        title: data.title,
        description: data.description,
        category: data.category,
        asset: data.asset,
        entryPrice: data.entryPrice ? data.entryPrice : null,
        targetPrice: data.targetPrice ? data.targetPrice : null,
        stopLoss: data.stopLoss ? data.stopLoss : null,
        question: data.question,
        predictedOutcome: data.predictedOutcome,
        timeframe: data.timeframe,
        externalUrl: data.externalUrl,
        externalMarketId: data.externalMarketId,
        predictionSource: data.predictionSource,
        encryptedPayload: data.encryptedPayload,
        nonce: data.nonce,
        contentHash: data.contentHash,
        visibility: data.visibility,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : null,
        onChainStatus: 'pending',
      },
    });

    // Write hash on-chain in background (non-blocking)
    // writeHashOnChain gets the keypair internally from MEMO_SIGNER_SECRET env var
    if (data.contentHash) {
      writeHashOnChain(data.contentHash).then(async (signature) => {
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { solanaTxSig: signature, onChainStatus: 'confirmed' },
        });
      }).catch(async (err) => {
        console.error('Failed to write hash on-chain:', err);
        // Will be retried by cron job
        await prisma.prediction.update({
          where: { id: prediction.id },
          data: { 
            onChainStatus: 'failed',
            lastVerificationError: err.message,
            verificationAttempts: { increment: 1 },
          },
        });
      });
    }

    return NextResponse.json({ 
      id: prediction.id,
      contentHash: prediction.contentHash,
      status: 'published',
      onChainStatus: prediction.onChainStatus,
    }, { status: 201 });
  } catch (error) {
    console.error('Publish prediction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}