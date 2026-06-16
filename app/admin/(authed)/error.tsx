"use client";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="card" style={{ marginTop: 32 }}>
      <h1>Something went wrong</h1>
      <p className="muted" style={{ marginTop: 8 }}>
        An unexpected error occurred in the admin panel.
      </p>
      <button onClick={reset} style={{ marginTop: 16 }}>
        Try again
      </button>
    </div>
  );
}
