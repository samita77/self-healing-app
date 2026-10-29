import { Link } from "react-router";

export default function AdminPage() {
  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">User Management</h2>
        <p className="text-xs text-slate-400 mb-4">
          View and manage all registered accounts.
        </p>
        <Link
          to="/users"
          className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700"
        >
          View all users →
        </Link>
      </section>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">All Projects</h2>
        <p className="text-xs text-slate-400 mb-4">
          View projects across all users.
        </p>
        <Link
          to="/dashboard"
          className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700"
        >
          View all projects →
        </Link>
      </section>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">All Deployments</h2>
        <p className="text-xs text-slate-400 mb-4">
          View deployments across all users.
        </p>
        <Link
          to="/deployments"
          className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700"
        >
          View all deployments →
        </Link>
      </section>
    </main>
  );
}
