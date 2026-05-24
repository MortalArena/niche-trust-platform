'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-4 text-center">
      <h1 className="text-2xl font-bold text-[var(--text-primary)]">Something went wrong</h1>
      <p className="max-w-md text-sm text-[var(--text-secondary)]">
        {error.message || 'An unexpected error occurred while loading this page.'}
      </p>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Try again
      </button>
      <a href="/" className="text-sm text-blue-600 hover:underline">
        Go to homepage
      </a>
    </div>
  );
}
