import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="not-found">
      <p className="eyebrow">404</p>
      <h1>That page is not in the course.</h1>
      <p className="muted">The lesson may have moved, or it has not been written yet.</p>
      <Link className="btn btn-primary" href="/">
        Back to the dashboard
      </Link>
    </div>
  );
}
