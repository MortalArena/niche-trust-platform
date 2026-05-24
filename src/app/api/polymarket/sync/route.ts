import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { syncExpertFromPolymarket } from '@/lib/polymarket/sync-expert';

const bodySchema = z.object({
  walletAddress: z.string().min(20).max(66).optional(),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);

  const wallet =
    parsed.data?.walletAddress ??
    (session.user as { walletAddress?: string }).walletAddress;

  if (!wallet) {
    return NextResponse.json({ error: 'No wallet address' }, { status: 400 });
  }

  const evmWallet = await prisma.wallet.findFirst({
    where: {
      userId: session.user.id,
      chain: { in: ['polygon', 'ethereum', 'arbitrum', 'base', 'optimism', 'bnb'] },
    },
    orderBy: { isPrimary: 'desc' },
  });

  const address = wallet.startsWith('0x') ? wallet : (evmWallet?.address ?? wallet);

  if (!address.startsWith('0x')) {
    return NextResponse.json(
      {
        error:
          'Polymarket sync requires an EVM address (Polygon proxy wallet). Link a Polygon/EVM wallet first.',
      },
      { status: 400 }
    );
  }

  try {
    const result = await syncExpertFromPolymarket(session.user.id, address);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Polymarket sync failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
