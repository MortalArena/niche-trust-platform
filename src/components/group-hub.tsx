'use client';

import { useState } from 'react';
import { MatrixChatEmbed } from '@/components/matrix-chat-embed';
import { MatrixSetupBanner } from '@/components/matrix-setup-banner';
import { GroupComments } from '@/components/group-comments';
type Tab = 'chat' | 'comments' | 'signals';

export function GroupHub({
  groupId,
  groupName,
  isPublic,
  hasAccess,
  isOwner,
  matrixRoomId,
  matrixChatUrl,
  hasMatrixUser,
  canComment,
  matrixConfigured,
}: {
  groupId: string;
  groupName: string;
  isPublic: boolean;
  hasAccess: boolean;
  isOwner: boolean;
  matrixRoomId: string | null;
  matrixChatUrl: string | null;
  hasMatrixUser: boolean;
  canComment: boolean;
  matrixConfigured: boolean;
}) {
  const [tab, setTab] = useState<Tab>(hasAccess ? 'chat' : 'comments');
  const matrixOn = matrixConfigured;

  const tabs: { id: Tab; label: string; show: boolean }[] = [
    { id: 'chat', label: 'Encrypted chat', show: hasAccess || isOwner },
    { id: 'comments', label: 'Comments', show: true },
    { id: 'signals', label: 'Signals & API', show: hasAccess || isOwner },
  ];

  return (
    <div className="mb-8">
      <div className="mb-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm dark:border-violet-800 dark:bg-violet-950/30">
        <span className="font-semibold text-violet-900 dark:text-violet-100">Private area: </span>
        <span className="text-violet-800 dark:text-violet-200">
          Use <strong>Encrypted chat</strong> for Matrix E2EE with the expert. <strong>Comments</strong>{' '}
          are public on the group page.
        </span>
      </div>
      <div className="mb-4 flex gap-1 overflow-x-auto border-b border-[var(--border)]">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition ${
                tab === t.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === 'chat' && (
        <div>
          {!matrixOn && (
            <div className="rounded-xl border border-amber-500/50 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
              Matrix server not configured. Set MATRIX_HOMESERVER and MATRIX_ADMIN_TOKEN in .env and run
              Synapse (see README).
            </div>
          )}
          {matrixOn && hasAccess && !hasMatrixUser && <MatrixSetupBanner />}
          {matrixOn && matrixChatUrl && matrixRoomId ? (
            <MatrixChatEmbed matrixChatUrl={matrixChatUrl} roomId={matrixRoomId} groupName={groupName} />
          ) : matrixOn && isOwner && matrixRoomId ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
              <p className="text-[var(--text-secondary)]">
                Encrypted room ready: <code className="text-xs">{matrixRoomId}</code>
              </p>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Subscribers are auto-invited after payment when they save their Matrix ID.
              </p>
            </div>
          ) : null}
        </div>
      )}

      {tab === 'comments' && (
        <GroupComments groupId={groupId} canPost={canComment} />
      )}

      {tab === 'signals' && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)]">Deliver signals to your AI agent</p>
          <ol className="mt-3 list-decimal space-y-2 pl-5">
            <li>Create an API key at <a href="/learn/agent-api" className="text-blue-600 hover:underline">/learn/agent-api</a></li>
            <li>Poll <code className="rounded bg-[var(--surface-hover)] px-1">GET /api/agent/v1/feed</code> with Bearer token</li>
            <li>Decrypt <code>encryptedPayload</code> with your group key (E2EE)</li>
          </ol>
          <p className="mt-4 text-xs text-[var(--text-muted)]">
            {isPublic ? 'Public group' : 'Private group'} · Platform cannot read message plaintext.
          </p>
        </div>
      )}
    </div>
  );
}
