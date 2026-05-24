'use client';

interface MatrixChatEmbedProps {
  matrixChatUrl: string;
  roomId: string;
  groupName?: string;
}

export function MatrixChatEmbed({ matrixChatUrl, roomId, groupName }: MatrixChatEmbedProps) {
  return (
    <div className="flex h-[520px] flex-col overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <div>
          <span className="text-sm font-semibold text-[var(--text-primary)]">
            Encrypted chat (Matrix E2EE)
          </span>
          {groupName && (
            <p className="text-xs text-[var(--text-muted)]">{groupName} · Megolm encryption</p>
          )}
        </div>
        <a
          href={matrixChatUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs font-medium text-blue-600 hover:underline"
        >
          Open full screen
        </a>
      </div>
      <iframe
        title="Matrix encrypted chat"
        src={matrixChatUrl}
        className="w-full flex-1 border-0 bg-[var(--bg)]"
        allow="clipboard-read; clipboard-write"
      />
      <p className="truncate px-4 py-2 font-mono text-xs text-[var(--text-muted)]">Room: {roomId}</p>
    </div>
  );
}
