'use client';

import { useEffect, useState } from 'react';

interface KeyRow {
  id: string;
  name: string;
  keyPrefix: string;
  permissions: string[];
  lastUsedAt: string | null;
}

export function AgentKeysManager() {
  const [keys, setKeys] = useState<KeyRow[]>([]);
  const [name, setName] = useState('My trading bot');
  const [secret, setSecret] = useState<string | null>(null);

  const load = () => {
    fetch('/api/agent/keys')
      .then((r) => r.json())
      .then((d) => setKeys(d.keys ?? []));
  };

  useEffect(() => {
    load();
  }, []);

  const create = async () => {
    const res = await fetch('/api/agent/keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const d = await res.json();
    if (res.ok) {
      setSecret(d.secret);
      load();
    }
  };

  const revoke = async (id: string) => {
    await fetch(`/api/agent/keys/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-[var(--text-primary)]">AI agent API keys</h2>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        Connect your bot to pull encrypted signals from subscribed groups.
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
        />
        <button
          type="button"
          onClick={create}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          Create key
        </button>
      </div>

      {secret && (
        <div className="mt-4 rounded-lg border-2 border-amber-500 bg-amber-50 p-4 dark:bg-amber-950/40">
          <p className="text-xs font-semibold text-amber-900 dark:text-amber-100">Copy now — shown once</p>
          <code className="mt-2 block break-all text-sm text-[var(--text-primary)]">{secret}</code>
        </div>
      )}

      <ul className="mt-4 space-y-2">
        {keys.map((k) => (
          <li
            key={k.id}
            className="flex items-center justify-between rounded-lg border border-[var(--border)] px-3 py-2 text-sm"
          >
            <span>
              <span className="font-medium text-[var(--text-primary)]">{k.name}</span>
              <span className="ml-2 font-mono text-[var(--text-muted)]">{k.keyPrefix}…</span>
            </span>
            <button type="button" onClick={() => revoke(k.id)} className="text-red-600 hover:underline">
              Revoke
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
