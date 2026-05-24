'use client';

import { useEffect, useState } from 'react';
import { EXPERT_SERVICE_TYPES } from '@/lib/experts/service-types';

export function ExpertProfileForm() {
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [types, setTypes] = useState<string[]>([]);
  const [acceptsAgent, setAcceptsAgent] = useState(true);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/expert/profile')
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          setHeadline(d.profile.expertHeadline ?? '');
          setBio(d.profile.expertBio ?? '');
          setTypes(d.profile.expertServiceTypes ?? []);
          setAcceptsAgent(d.profile.acceptsAgentApi ?? true);
        }
      });
  }, []);

  const toggle = (slug: string) => {
    setTypes((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  };

  const save = async () => {
    setMsg(null);
    const res = await fetch('/api/expert/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        expertHeadline: headline,
        expertBio: bio,
        expertServiceTypes: types,
        acceptsAgentApi: acceptsAgent,
      }),
    });
    if (!res.ok) {
      setMsg('Save failed');
      return;
    }
    setMsg('Profile saved');
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">What do you sell?</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Tell clients exactly who you are — signals, alpha, whale tracking, etc.
      </p>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Headline</label>
        <input
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder="e.g. Polymarket whale tracker · 5yr edge"
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4">
        <label className="mb-1 block text-sm font-medium text-[var(--text-primary)]">Bio</label>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
      </div>

      <div className="mt-4">
        <p className="mb-2 text-sm font-medium text-[var(--text-primary)]">Service types</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {EXPERT_SERVICE_TYPES.map((s) => (
            <label
              key={s.slug}
              className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-sm ${
                types.includes(s.slug)
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40'
                  : 'border-[var(--border)]'
              }`}
            >
              <input
                type="checkbox"
                checked={types.includes(s.slug)}
                onChange={() => toggle(s.slug)}
                className="mt-1"
              />
              <span>
                <span className="font-medium text-[var(--text-primary)]">
                  {s.icon} {s.name}
                </span>
                <span className="mt-0.5 block text-xs text-[var(--text-muted)]">{s.description}</span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={acceptsAgent}
          onChange={(e) => setAcceptsAgent(e.target.checked)}
        />
        Allow clients to connect AI agents via API keys
      </label>

      <button
        type="button"
        onClick={save}
        className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Save expert profile
      </button>
      {msg && <p className="mt-2 text-sm text-emerald-600">{msg}</p>}
    </div>
  );
}
