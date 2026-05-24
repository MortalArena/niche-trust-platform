'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';

export function CreateBotForm() {
  const { data: session } = useSession();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricingModel, setPricingModel] = useState<'free' | 'sell' | 'rent' | 'course'>('sell');
  const [priceUsd, setPriceUsd] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [msg, setMsg] = useState<string | null>(null);

  if (!session?.user) {
    return (
      <p className="text-sm text-[var(--text-secondary)]">
        <Link href="/connect" className="text-blue-600 hover:underline">
          Sign in
        </Link>{' '}
        to list a bot.
      </p>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch('/api/bots', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description,
        pricingModel,
        priceUsd: priceUsd ? parseFloat(priceUsd) : undefined,
        externalUrl: externalUrl || undefined,
      }),
    });
    if (!res.ok) {
      setMsg('Failed to create listing');
      return;
    }
    setMsg('Bot listed!');
    setName('');
    setDescription('');
  };

  return (
    <form onSubmit={submit} className="max-w-md space-y-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        placeholder="Bot name"
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        rows={3}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
      />
      <select
        value={pricingModel}
        onChange={(e) => setPricingModel(e.target.value as typeof pricingModel)}
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
      >
        <option value="free">Free</option>
        <option value="sell">Sell</option>
        <option value="rent">Rent</option>
        <option value="course">Course / teach</option>
      </select>
      <input
        value={priceUsd}
        onChange={(e) => setPriceUsd(e.target.value)}
        type="number"
        min="0"
        placeholder="Price USD (optional)"
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
      />
      <input
        value={externalUrl}
        onChange={(e) => setExternalUrl(e.target.value)}
        placeholder="Link (GitHub, Telegram, etc.)"
        className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
      />
      <button type="submit" className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white">
        Publish bot
      </button>
      {msg && <p className="text-sm text-emerald-600">{msg}</p>}
    </form>
  );
}
