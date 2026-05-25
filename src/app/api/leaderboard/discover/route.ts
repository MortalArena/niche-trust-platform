import { NextRequest, NextResponse } from 'next/server';
import { discoverAndImport } from '@/lib/polymarket/discovery';
import { auth } from '@/auth';
import { logger } from '@/lib/logger';

/**
 * POST /api/leaderboard/discover
 * 
 * Discovers new Polymarket traders from active events and imports them
 * into the trader cache for subsequent trust score computation.
 * 
 * Intended for: admin panel, cron job, or manual trigger.
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const categorySlug: string | undefined = body.category ?? undefined;

    const result = await discoverAndImport(categorySlug);

    logger.info(
      { discovered: result.discovered, imported: result.imported },
      'Discovery completed via API'
    );

    return NextResponse.json({
      success: true,
      ...result,
      note: 'Discovered traders will be synced with full trust scores on the next cron cycle.',
    });
  } catch (error) {
    logger.error({ error }, 'Discovery API failed');
    return NextResponse.json({ error: 'Discovery failed' }, { status: 500 });
  }
}

/**
 * GET /api/leaderboard/discover
 * Returns the discovery status.
 */
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    endpoint: 'POST /api/leaderboard/discover',
    description: 'Send POST to discover new Polymarket traders from active events.',
    example: {
      body: { category: 'sports' },
    },
    supportedCategories: [
      'sports', 'politics', 'crypto', 'science-tech',
      'economics', 'culture', 'business', 'geopolitics',
      'climate-weather', 'esports', 'world-events',
    ],
  });
}