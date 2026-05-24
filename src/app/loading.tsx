export default function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-[var(--bg)]">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <p className="text-sm text-[var(--text-secondary)]">Loading Niche Trust…</p>
    </div>
  );
}
