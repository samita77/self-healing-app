import { Link } from "react-router";

export default function NotFoundContent() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-10 text-center">
      <h1 className="text-6xl font-semibold text-slate-50">404</h1>
      <p className="text-sm text-slate-400">This page could not be found.</p>
      <Link
        to="/"
        className="rounded-lg border border-slate-600 px-4 py-2 text-sm hover:border-slate-400"
      >
        Back to projects
      </Link>
    </main>
  );
}
