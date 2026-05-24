import Link from 'next/link';
import { notFound } from 'next/navigation';
import { auth } from '@/auth';
import { prisma } from '@/lib/db';
import { userHasActiveSubscription } from '@/lib/groups/service';
import { getMatrixRoomUrl, isMatrixConfigured } from '@/lib/matrix/client';
import { getCategoryBySlug } from '@/lib/markets/categories';
import { canPostComment, canViewComments } from '@/lib/comments/service';
import { getServiceType } from '@/lib/experts/service-types';
import { SubscribeGroupForm } from '@/components/subscribe-group-form';
import { GroupHub } from '@/components/group-hub';
import { ReviewForm } from '@/components/review-form';
import { StarRating } from '@/components/star-rating';
import { PageShell } from '@/components/ui/page-shell';

export const dynamic = 'force-dynamic';

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const group = await prisma.group.findUnique({
    where: { id },
    include: {
      owner: {
        select: {
          id: true,
          displayName: true,
          walletAddress: true,
          matrixUserId: true,
          scores: { take: 1, orderBy: { lastCalculatedAt: 'desc' } },
        },
      },
      reviews: {
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: {
          user: { select: { displayName: true, isAnonymous: true } },
        },
      },
    },
  });

  if (!group) notFound();

  const isOwner = session?.user?.id === group.ownerId;
  const hasAccess =
    isOwner ||
    (session?.user?.id ? await userHasActiveSubscription(session.user.id, group.id) : false);

  const userRow = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { matrixUserId: true },
      })
    : null;

  const canComment =
    session?.user?.id != null && (await canPostComment(session.user.id, group));
  const canViewDisc =
    await canViewComments(session?.user?.id ?? null, group);

  const existingReview =
    session?.user?.id &&
    (await prisma.groupReview.findUnique({
      where: { userId_groupId: { userId: session.user.id, groupId: group.id } },
    }));

  const canReview =
    session?.user?.id &&
    !isOwner &&
    !existingReview &&
    (await prisma.subscription.findFirst({
      where: {
        userId: session.user.id,
        groupId: group.id,
        status: { in: ['active', 'expired'] },
      },
    }));

  const matrixConfigured = isMatrixConfigured();
  const matrixChatUrl =
    hasAccess && group.matrixRoomId && matrixConfigured
      ? getMatrixRoomUrl(group.matrixRoomId)
      : null;

  const cat = getCategoryBySlug(group.categorySlug);
  const groupExtras = group as typeof group & {
    serviceTypes?: string[];
    owner: typeof group.owner & { expertHeadline?: string | null; expertServiceTypes?: string[] };
  };
  const expertHeadline = groupExtras.owner.expertHeadline ?? null;
  const serviceSlugs = [
    ...new Set([
      ...(groupExtras.serviceTypes ?? []),
      ...(groupExtras.owner.expertServiceTypes ?? []),
    ]),
  ];

  return (
    <PageShell showCategoryNav={false}>
      <div className="mx-auto max-w-4xl">
        <Link href="/groups" className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline">
          ← Groups
        </Link>

        <p className="text-xs font-medium text-blue-600">
          {cat?.icon} {cat?.name ?? group.categorySlug}
          {!group.isPublic && <span className="ml-2">· Private</span>}
        </p>
        <h1 className="mb-2 text-2xl font-bold text-[var(--text-primary)]">{group.name}</h1>
        {expertHeadline && (
          <p className="mb-2 text-sm font-medium text-[var(--text-secondary)]">{expertHeadline}</p>
        )}
        {group.description && <p className="mb-4 text-[var(--text-secondary)]">{group.description}</p>}

        {serviceSlugs.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {serviceSlugs.map((slug) => {
              const s = getServiceType(slug);
              return (
                <span
                  key={slug}
                  className="rounded-full border border-[var(--border)] bg-[var(--surface-hover)] px-3 py-1 text-xs font-medium text-[var(--text-primary)]"
                >
                  {s?.icon} {s?.name ?? slug}
                </span>
              );
            })}
          </div>
        )}

        <div className="mb-4 flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
          <span className="font-semibold text-blue-600">${Number(group.monthlyPriceUsd)}/mo</span>
          {group.yearlyPriceUsd && <span>${Number(group.yearlyPriceUsd)}/yr</span>}
          <span>{group.subscriberCount} subscribers</span>
        </div>

        {group.reviewCount > 0 && (
          <div className="mb-6">
            <StarRating rating={Number(group.avgRating)} />
            <span className="ml-2 text-sm text-[var(--text-muted)]">
              {group.reviewCount} verified subscriber reviews
            </span>
          </div>
        )}

        {group.owner.walletAddress && (
          <Link
            href={`/trader/${group.owner.walletAddress}`}
            className="mb-6 inline-block text-sm font-medium text-blue-600 hover:underline"
          >
            View expert profile
          </Link>
        )}

        {!hasAccess && !isOwner && session?.user && (
          <div className="mb-8">
            <SubscribeGroupForm
              groupId={group.id}
              monthlyPrice={Number(group.monthlyPriceUsd)}
              yearlyPrice={group.yearlyPriceUsd ? Number(group.yearlyPriceUsd) : null}
            />
          </div>
        )}

        {!session?.user && (
          <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-center">
            <p className="mb-4 text-[var(--text-secondary)]">Sign in to subscribe or comment</p>
            <Link href="/connect" className="rounded-lg bg-blue-600 px-6 py-2 font-semibold text-white">
              Connect wallet
            </Link>
          </div>
        )}

        {canViewDisc && (
          <GroupHub
            groupId={group.id}
            groupName={group.name}
            isPublic={group.isPublic}
            hasAccess={hasAccess}
            isOwner={isOwner}
            matrixRoomId={group.matrixRoomId}
            matrixChatUrl={matrixChatUrl}
            hasMatrixUser={Boolean(userRow?.matrixUserId)}
            canComment={canComment}
            matrixConfigured={matrixConfigured}
          />
        )}

        {canReview && (
          <div className="mb-8">
            <ReviewForm groupId={group.id} />
          </div>
        )}

        {group.reviews.length > 0 && (
          <section>
            <h2 className="mb-4 text-lg font-semibold text-[var(--text-primary)]">Subscriber reviews</h2>
            <ul className="space-y-4">
              {group.reviews.map((r) => (
                <li key={r.id} className="rounded-lg border border-[var(--border)] bg-[var(--surface)] p-4">
                  <StarRating rating={r.rating} size="sm" />
                  {r.comment && <p className="mt-2 text-sm text-[var(--text-secondary)]">{r.comment}</p>}
                  <p className="mt-1 text-xs text-[var(--text-muted)]">
                    {r.user.isAnonymous ? 'Verified subscriber' : r.user.displayName} ·{' '}
                    {r.createdAt.toLocaleDateString('en-US')}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </PageShell>
  );
}
