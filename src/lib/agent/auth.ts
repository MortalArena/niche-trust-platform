import { createHash, randomBytes } from 'crypto';
import { prisma } from '@/lib/db';

export const AGENT_KEY_PREFIX = 'nt_live_';

export function hashAgentKey(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export function generateAgentKey(): { raw: string; hash: string; prefix: string } {
  const secret = randomBytes(24).toString('base64url');
  const raw = `${AGENT_KEY_PREFIX}${secret}`;
  return {
    raw,
    hash: hashAgentKey(raw),
    prefix: raw.slice(0, 16),
  };
}

export async function authenticateAgent(req: Request) {
  const header = req.headers.get('authorization');
  if (!header?.startsWith('Bearer ')) {
    return { error: 'missing_token' as const };
  }

  const token = header.slice(7).trim();
  if (!token.startsWith(AGENT_KEY_PREFIX)) {
    return { error: 'invalid_token' as const };
  }

  const keyHash = hashAgentKey(token);
  const record = await prisma.agentKey.findFirst({
    where: { keyHash, isActive: true },
    include: { user: { select: { id: true, acceptsAgentApi: true, displayName: true } } },
  });

  if (!record) return { error: 'invalid_token' as const };
  if (record.expiresAt && record.expiresAt < new Date()) {
    return { error: 'expired' as const };
  }
  if (!record.user.acceptsAgentApi) {
    return { error: 'forbidden' as const };
  }

  await prisma.agentKey.update({
    where: { id: record.id },
    data: { lastUsedAt: new Date() },
  });

  return { error: null, userId: record.userId, permissions: record.permissions, keyId: record.id };
}

export function hasPermission(permissions: string[], perm: string) {
  return permissions.includes(perm) || permissions.includes('*');
}
