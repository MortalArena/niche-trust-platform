import { NextResponse } from 'next/server';
import { listEvents } from '@/lib/polymarket/gamma';

/** JSON API for agents — browsers should use /polymarket */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const accept = req.headers.get('accept') ?? '';
  const tag_slug = searchParams.get('tag_slug') ?? undefined;
  const limit = Math.min(parseInt(searchParams.get('limit') ?? '20', 10), 50);

  try {
    const events = await listEvents({ limit, tag_slug, active: true, closed: false });

    if (accept.includes('text/html') && !accept.includes('application/json')) {
      return NextResponse.redirect(new URL('/polymarket', req.url));
    }

    return NextResponse.json({ events, source: 'gamma-api.polymarket.com' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch events';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
