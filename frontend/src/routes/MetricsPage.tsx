const GRAFANA = import.meta.env.VITE_GRAFANA_URL ?? "";

export default function MetricsPage() {
  return (
    <main className="mx-auto max-w-[1400px] p-10 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Metrics</h1>
        <p className="mt-1 text-sm text-slate-400">
          Live CPU, memory and request data scraped from deployed workloads.
        </p>
      </div>

      {GRAFANA ? (
        <iframe
          src={`${GRAFANA}/d-solo`}
          title="Application metrics from Grafana"
          className="h-[70vh] w-full rounded-lg border border-[#475569] bg-[#1B2336]"
        />
      ) : (
        <p className="text-sm text-slate-400">
          Grafana URL is not configured. Set{" "}
          <code className="font-mono text-slate-300">VITE_GRAFANA_URL</code> in{" "}
          <code className="font-mono text-slate-300">.env.local</code>.
        </p>
      )}
    </main>
  );
}
