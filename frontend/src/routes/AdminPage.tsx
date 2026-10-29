import { Link } from "react-router";

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <h1 className="text-xl font-semibold tracking-tight">Admin Panel</h1>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold mb-4">User Management</h2>
        <p className="text-xs text-ink-muted mb-4">
          View and manage all registered accounts.
        </p>
        <Link
          to="/users"
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface"
        >
          View all users →
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold mb-4">All Projects</h2>
        <p className="text-xs text-ink-muted mb-4">
          View projects across all users.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface"
        >
          View all projects →
        </Link>
      </section>

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <h2 className="text-sm font-semibold mb-4">All Deployments</h2>
        <p className="text-xs text-ink-muted mb-4">
          View deployments across all users.
        </p>
        <Link
          to="/deployments"
          className="px-4 py-2 rounded-lg border border-border text-sm hover:bg-surface"
        >
          View all deployments →
        </Link>
      </section>
    </main>
  );
}
