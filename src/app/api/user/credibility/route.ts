import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { computeFullCredibility } from '@/lib/analytics/credibility';

/**
 * GET /api/user/credibility
 * Returns the full credibility profile of the authenticated user,
 * or a specific user if admin.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const credibility = await computeFullCredibility(userId);

    return NextResponse.json({
      success: true,
      userId,
      credibility,
    });
  } catch (error) {
    console.error('Credibility API error:', error);
    return NextResponse.json({ error: 'Failed to compute credibility' }, { status: 500 });
  }
}