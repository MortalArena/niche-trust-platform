import { NICHE_TRUST_API_SECTIONS } from '@/lib/learn/api-catalog';

export function ApiCatalogTable() {
  return (
    <div className="space-y-8">
      {NICHE_TRUST_API_SECTIONS.map((section) => (
        <section key={section.title}>
          <h2 className="mb-3 text-lg font-semibold text-[var(--text-primary)]">{section.title}</h2>
          <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-[var(--border)] bg-[var(--surface-hover)]">
                <tr>
                  <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">Method</th>
                  <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">Path</th>
                  <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">Auth</th>
                  <th className="px-4 py-2 font-semibold text-[var(--text-primary)]">Description</th>
                </tr>
              </thead>
              <tbody>
                {section.endpoints.map((ep) => (
                  <tr key={`${ep.method}-${ep.path}`} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-mono text-xs font-semibold text-emerald-600">{ep.method}</td>
                    <td className="px-4 py-2 font-mono text-xs text-[var(--text-primary)]">{ep.path}</td>
                    <td className="px-4 py-2 text-xs text-[var(--text-secondary)]">{ep.auth}</td>
                    <td className="px-4 py-2 text-[var(--text-secondary)]">{ep.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </div>
  );
}
