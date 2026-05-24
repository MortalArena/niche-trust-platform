'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fff', color: '#09090b' }}>
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Niche Trust — application error</h1>
          <p style={{ marginTop: 12, maxWidth: 480, color: '#52525b', fontSize: 14 }}>
            {error.message || 'The app failed to load. This is often fixed by refreshing or restarting the dev server.'}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{ marginTop: 20, padding: '10px 24px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}
          >
            Try again
          </button>
          <a href="/" style={{ marginTop: 16, fontSize: 14, color: '#2563eb' }}>
            Go to homepage
          </a>
        </div>
      </body>
    </html>
  );
}
