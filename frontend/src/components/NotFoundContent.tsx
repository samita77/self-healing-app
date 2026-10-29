import { Link } from "react-router";

export default function NotFoundContent() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-4 sm:p-6 lg:p-10 text-center">
      <h1 className="text-6xl font-semibold text-ink">404</h1>
      <p className="text-sm text-ink-muted">This page could not be found.</p>
      <Link
        to="/"
        className="rounded-lg border border-border px-4 py-2 text-sm hover:border-border"
      >
        Back to projects
      </Link>
    </main>
  );
}
