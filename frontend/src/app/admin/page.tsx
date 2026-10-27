import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";

export const instant = false;

export default async function AdminPage() {
  const store = await cookies();
  const token = store.get("token")?.value;

  if (!token) redirect("/login");

  let role = "user";
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    role = payload.role || "user";
  } catch {}

  if (role !== "admin") redirect("/dashboard");

  return (
    <main className="p-10 space-y-6">
      <h1 className="text-2xl font-semibold">Admin Panel</h1>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">User Management</h2>
        <p className="text-xs text-slate-400 mb-4">View and manage all registered accounts.</p>
        <Link href="/users" className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700">View all users →</Link>
      </section>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">All Projects</h2>
        <p className="text-xs text-slate-400 mb-4">View projects across all users.</p>
        <Link href="/projects" className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700">View all projects →</Link>
      </section>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">All Deployments</h2>
        <p className="text-xs text-slate-400 mb-4">View deployments across all users.</p>
        <Link href="/deployments" className="px-4 py-2 rounded-lg border border-slate-600 text-sm hover:bg-slate-700">View all deployments →</Link>
      </section>
    </main>
  );
}