import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { canPostComment, canViewComments } from '@/lib/comments/service';

const postSchema = z.object({
  body: z.string().min(1).max(2000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: groupId } = await params;
  const session = await auth();

  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await canViewComments(session?.user?.id ?? null, group);
  if (!allowed) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const comments = await prisma.groupComment.findMany({
    where: { groupId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, displayName: true, isAnonymous: true } },
    },
  });

  return NextResponse.json({
    comments: comments.map((c) => ({
      id: c.id,
      body: c.body,
      createdAt: c.createdAt,
      author: c.user.isAnonymous ? 'Member' : c.user.displayName ?? 'User',
      userId: c.user.id,
    })),
  });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Sign in to comment' }, { status: 401 });
  }

  const { id: groupId } = await params;
  const group = await prisma.group.findUnique({ where: { id: groupId } });
  if (!group) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const allowed = await canPostComment(session.user.id, group);
  if (!allowed) {
    return NextResponse.json(
      { error: group.isPublic ? 'Comments disabled' : 'Subscribe to comment in private groups' },
      { status: 403 }
    );
  }

  const parsed = postSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid comment' }, { status: 400 });
  }

  const comment = await prisma.groupComment.create({
    data: {
      groupId,
      userId: session.user.id,
      body: parsed.data.body.trim(),
    },
    include: {
      user: { select: { displayName: true, isAnonymous: true } },
    },
  });

  return NextResponse.json({
    comment: {
      id: comment.id,
      body: comment.body,
      createdAt: comment.createdAt,
      author: comment.user.isAnonymous ? 'Member' : comment.user.displayName ?? 'User',
    },
  });
}
