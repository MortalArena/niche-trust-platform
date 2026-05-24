'use client';

import { useState } from 'react';

export function CodeBlock({
  code,
  language,
  filename,
}: {
  code: string;
  language?: string;
  filename?: string;
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-[var(--border)] bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2">
        <span className="text-xs text-zinc-400">{filename ?? language ?? 'code'}</span>
        <button
          type="button"
          onClick={() => void copy()}
          className="text-xs font-medium text-zinc-300 hover:text-white"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-4 text-sm leading-relaxed text-zinc-100">
        <code>{code}</code>
      </pre>
    </div>
  );
}
