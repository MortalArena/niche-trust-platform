'use client';

import { useState } from 'react';

interface ReviewFormProps {
  groupId: string;
}

export function ReviewForm({ groupId }: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to submit review');
        return;
      }
      setDone(true);
      window.location.reload();
    } catch {
      setError('Connection error');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return <p className="text-sm text-green-400">Thank you for your verified review.</p>;
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
      <h3 className="font-semibold">Rate this group (verified subscribers only)</h3>
      <p className="text-xs text-zinc-500">
        Only customers who paid for a subscription can leave a review — helps prevent fake ratings.
      </p>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`rounded px-3 py-1 text-lg ${
              rating >= n ? 'text-amber-400' : 'text-zinc-600'
            }`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Optional: share your experience with this expert's information..."
        rows={3}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm"
      />
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-violet-600 px-4 py-2 text-sm text-white hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? 'Submitting...' : 'Submit review'}
      </button>
      {error && <p className="text-sm text-red-400">{error}</p>}
    </form>
  );
}
