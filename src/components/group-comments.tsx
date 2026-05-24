'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

interface Comment {
  id: string;
  body: string;
  createdAt: string;
  author: string;
}

export function GroupComments({
  groupId,
  canPost,
}: {
  groupId: string;
  canPost: boolean;
}) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [body, setBody] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    fetch(`/api/groups/${groupId}/comments`)
      .then((r) => r.json())
      .then((d) => setComments(d.comments ?? []))
      .catch(() => setComments([]));
  };

  useEffect(() => {
    load();
  }, [groupId]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/groups/${groupId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body: body.trim() }),
    });
    const d = await res.json();
    if (!res.ok) {
      setError(d.error ?? 'Failed to post');
      setLoading(false);
      return;
    }
    setBody('');
    setComments((prev) => [d.comment, ...prev]);
    setLoading(false);
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] shadow-sm">
      <div className="flex items-center justify-between border-b border-[var(--border)] px-4 py-3">
        <h2 className="font-semibold text-[var(--text-primary)]">Discussion</h2>
        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-800 dark:bg-amber-950 dark:text-amber-200">
          Beware of external links
        </span>
      </div>

      {canPost && session?.user ? (
        <form onSubmit={submit} className="border-b border-[var(--border)] p-4">
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Add a comment…"
            rows={3}
            maxLength={2000}
            className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--text-primary)]"
          />
          <button
            type="submit"
            disabled={loading || !body.trim()}
            className="mt-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Posting…' : 'Post comment'}
          </button>
          {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
        </form>
      ) : (
        <p className="border-b border-[var(--border)] p-4 text-sm text-[var(--text-secondary)]">
          {session?.user
            ? 'Subscribe to join the discussion in this private group.'
            : 'Sign in to comment on public groups.'}
        </p>
      )}

      <ul className="max-h-96 divide-y divide-[var(--border)] overflow-y-auto">
        {comments.length === 0 ? (
          <li className="p-6 text-center text-sm text-[var(--text-muted)]">No comments yet.</li>
        ) : (
          comments.map((c) => (
            <li key={c.id} className="px-4 py-3">
              <div className="flex items-center gap-2 text-sm">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-violet-500 text-xs font-bold text-white">
                  {c.author.slice(0, 1).toUpperCase()}
                </span>
                <span className="font-semibold text-[var(--text-primary)]">{c.author}</span>
                <span className="text-[var(--text-muted)]">
                  {new Date(c.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-[var(--text-secondary)]">{c.body}</p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
