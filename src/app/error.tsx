'use client';

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="not-found" role="alert">
      <h1>This page stopped working.</h1>
      <p className="muted">Your progress is saved in this browser and is not affected.</p>
      <button type="button" className="btn btn-primary" onClick={() => retry()}>
        Try again
      </button>
    </div>
  );
}
