import Link from 'next/link';
import type { LearnBlock } from '@/lib/learn/types';
import { CodeBlock } from './code-block';
import { AgentKeysManager } from '@/components/agent-keys-manager';
import { ApiCatalogTable } from './api-catalog-table';

export function DocRenderer({ blocks }: { blocks: LearnBlock[] }) {
  return (
    <article className="prose-learn max-w-none">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'p':
            return (
              <p key={i} className="mb-4 leading-relaxed text-[var(--text-secondary)]">
                {block.text}
              </p>
            );
          case 'h2':
            return (
              <h2 key={i} className="mb-3 mt-10 text-xl font-bold text-[var(--text-primary)]">
                {block.text}
              </h2>
            );
          case 'h3':
            return (
              <h3 key={i} className="mb-2 mt-6 text-lg font-semibold text-[var(--text-primary)]">
                {block.text}
              </h3>
            );
          case 'ul':
            return (
              <ul key={i} className="mb-4 list-disc space-y-2 pl-6 text-[var(--text-secondary)]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            );
          case 'ol':
            return (
              <ol key={i} className="mb-4 list-decimal space-y-2 pl-6 text-[var(--text-secondary)]">
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ol>
            );
          case 'code':
            return (
              <CodeBlock
                key={i}
                code={block.code}
                language={block.language}
                filename={block.filename}
              />
            );
          case 'callout':
            return (
              <div
                key={i}
                className={`mb-4 rounded-xl border p-4 text-sm ${
                  block.variant === 'warning'
                    ? 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100'
                    : block.variant === 'success'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-100'
                      : 'border-blue-200 bg-blue-50 text-blue-900 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-100'
                }`}
              >
                {block.title && <p className="mb-1 font-semibold">{block.title}</p>}
                <p>{block.text}</p>
              </div>
            );
          case 'links':
            return (
              <div key={i} className="mb-6 flex flex-wrap gap-3">
                {block.items.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="inline-flex rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            );
          case 'hero':
            return (
              <div
                key={i}
                className="mb-10 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 shadow-sm md:p-8"
              >
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{block.title}</h2>
                <p className="mt-2 max-w-2xl text-[var(--text-secondary)]">{block.description}</p>
                <Link
                  href={block.ctaHref}
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  {block.ctaLabel}
                </Link>
              </div>
            );
          case 'table':
            return (
              <div key={i} className="mb-6 overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead className="bg-[var(--surface-hover)]">
                    <tr>
                      {block.headers.map((h) => (
                        <th key={h} className="px-4 py-2 font-semibold text-[var(--text-primary)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row, ri) => (
                      <tr key={ri} className="border-t border-[var(--border)]">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-4 py-2 text-[var(--text-secondary)]">
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case 'api-catalog':
            return <ApiCatalogTable key={i} />;
          case 'agent-keys':
            return (
              <div key={i} className="my-6 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                <AgentKeysManager />
              </div>
            );
          default:
            return null;
        }
      })}
    </article>
  );
}
