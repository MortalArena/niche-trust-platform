import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { searchPublic } from '@/lib/polymarket/gamma';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim() ?? '';
  if (q.length < 2) {
    return NextResponse.json({ query: q, markets: [], groups: [], experts: [] });
  }

  const [events, groups, expertScores] = await Promise.all([
    searchPublic(q, 12).catch(() => []),
    prisma.group.findMany({
      where: {
        isPublic: true,
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { description: { contains: q, mode: 'insensitive' } },
        ],
      },
      take: 10,
      select: {
        id: true,
        name: true,
        description: true,
        categorySlug: true,
        monthlyPriceUsd: true,
        subscriberCount: true,
      },
    }),
    prisma.traderScore.findMany({
      where: {
        user: {
          OR: [
            { displayName: { contains: q, mode: 'insensitive' } },
            { walletAddress: { contains: q, mode: 'insensitive' } },
          ],
        },
      },
      take: 10,
      orderBy: { trustScore: 'desc' },
      include: {
        user: { select: { id: true, displayName: true, walletAddress: true, isAnonymous: true } },
      },
    }),
  ]);

  return NextResponse.json({
    query: q,
    markets: events.map((e) => ({
      id: e.id,
      slug: e.slug,
      title: e.title,
      href: `https://polymarket.com/event/${e.slug}`,
    })),
    groups: groups.map((g) => ({
      id: g.id,
      name: g.name,
      description: g.description,
      categorySlug: g.categorySlug,
      priceUsd: Number(g.monthlyPriceUsd),
      subscribers: g.subscriberCount,
      href: `/groups/${g.id}`,
    })),
    experts: expertScores.map((s) => ({
      userId: s.user.id,
      displayName: s.user.isAnonymous ? 'Anonymous expert' : s.user.displayName,
      wallet: s.user.walletAddress,
      trustScore: Number(s.trustScore),
      href: s.user.walletAddress ? `/trader/${s.user.walletAddress}` : `/experts`,
    })),
  });
}
