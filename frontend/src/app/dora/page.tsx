import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const instant = false;

async function getDoraMetrics() {
  const store = await cookies();
  const token = store.get("token")?.value;
  const res = await fetch(`${process.env.BACKEND_URL ?? "http://localhost:8000"}/dora/metrics`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.json();
}

export default async function DORAPage() {
  const store = await cookies();
  const token = store.get("token")?.value;
  if (!token) redirect("/login");

  const metrics = await getDoraMetrics();

  return (
    <main className="p-10 space-y-8">
      <h1 className="text-2xl font-semibold">DORA Metrics</h1>
      <p className="text-sm text-slate-400">
        Delivery performance metrics based on the DORA framework.
      </p>

      {!metrics ? (
        <p className="text-sm text-slate-400">No data available.</p>
      ) : (
        <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400 mb-6">
            Delivery Performance
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Deployment frequency
              </h3>
              <p className="text-2xl font-mono text-green-500">
                {metrics.deployment_frequency}/day
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Successful deployments per day (7-day avg)
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Lead time for changes
              </h3>
              <p className="text-2xl font-mono text-blue-500">
                {metrics.lead_time_hours.toFixed(1)}h
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Median commit → deploy time
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Mean time to recovery
              </h3>
              <p className="text-2xl font-mono text-amber-500">
                {metrics.mttr_hours.toFixed(1)}h
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Median failure → rollback time
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-[#0F172A] p-4">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                Change failure rate
              </h3>
              <p className="text-2xl font-mono text-red-500">
                {metrics.change_failure_rate}%
              </p>
              <p className="text-xs text-slate-500 mt-1">
                Failed deployments / total
              </p>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
