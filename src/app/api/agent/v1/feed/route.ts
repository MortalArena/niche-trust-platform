import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { authenticateAgent, hasPermission } from '@/lib/agent/auth';

/**
 * AI agent feed — pull encrypted signals from groups the key owner subscribes to.
 * Payloads stay E2EE; your agent stores group keys client-side to decrypt.
 */
export async function GET(req: Request) {
  const authResult = await authenticateAgent(req);
  if (authResult.error) {
    const status =
      authResult.error === 'forbidden' ? 403 : authResult.error === 'expired' ? 401 : 401;
    return NextResponse.json({ error: authResult.error }, { status });
  }

  if (!hasPermission(authResult.permissions, 'read:signals')) {
    return NextResponse.json({ error: 'Missing read:signals permission' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const since = searchParams.get('since');
  const sinceDate = since ? new Date(since) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const subs = await prisma.subscription.findMany({
    where: {
      userId: authResult.userId,
      status: 'active',
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { groupId: true },
  });

  const groupIds = subs.map((s) => s.groupId);
  if (groupIds.length === 0) {
    return NextResponse.json({ signals: [], groups: [], note: 'No active subscriptions' });
  }

  const predictions = await prisma.prediction.findMany({
    where: {
      groupId: { in: groupIds },
      createdAt: { gte: sinceDate },
    },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      groupId: true,
      encryptedPayload: true,
      nonce: true,
      contentHash: true,
      solanaTxSig: true,
      onChainStatus: true,
      createdAt: true,
      author: { select: { id: true, displayName: true } },
    },
  });

  const groups = await prisma.group.findMany({
    where: { id: { in: groupIds } },
    select: {
      id: true,
      name: true,
      matrixRoomId: true,
      serviceTypes: true,
      owner: { select: { id: true, displayName: true, expertServiceTypes: true } },
    },
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    signals: predictions,
    groups,
    security: {
      encryption: 'Client-side E2EE — platform cannot read plaintext',
      matrixChat: 'Use Matrix room IDs for encrypted group chat (Megolm)',
    },
  });
}
