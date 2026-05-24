import { NextResponse } from 'next/server';
import { listTags } from '@/lib/polymarket/gamma';

export async function GET(req: Request) {
  const limit = Math.min(parseInt(new URL(req.url).searchParams.get('limit') ?? '50', 10), 200);
  try {
    const tags = await listTags(limit);
    return NextResponse.json({ tags, source: 'gamma-api.polymarket.com' });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to fetch tags';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
