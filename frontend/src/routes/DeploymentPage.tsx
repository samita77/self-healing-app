import { useParams } from "react-router";
import HealthCheckForm from "@/components/HealthCheckForm";
import HealthGauge from "@/components/HealthGauge";
import NotFoundContent from "@/components/NotFoundContent";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import StatusBadge from "@/components/StatusBadge";
import {
  useDeployment,
  useHealthChecks,
  useRollbackEvents,
} from "@/hooks/useDeployments";

function DeploymentSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading deployment">
      <div className="h-9 w-64 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
      <div className="h-40 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
      <div className="h-40 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
    </div>
  );
}

export default function DeploymentPage() {
  const params = useParams();
  const deploymentId = Number(params.id);
  const isValidId = Number.isFinite(deploymentId);

  const deploymentQuery = useDeployment(deploymentId);
  const checksQuery = useHealthChecks(deploymentId);
  const rollbacksQuery = useRollbackEvents(deploymentId);

  if (!isValidId) return <NotFoundContent />;
  if (deploymentQuery.isLoading) {
    return (
      <main className="p-10">
        <DeploymentSkeleton />
      </main>
    );
  }
  if (deploymentQuery.isError || !deploymentQuery.data) return <NotFoundContent />;

  const deployment = deploymentQuery.data;
  const checks = checksQuery.data ?? [];
  const rollbacks = rollbacksQuery.data ?? [];
  const latest = checks.length > 0 ? checks[checks.length - 1] : null;

  return (
    <main className="p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Deployment {deployment.version}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          {latest ? (
            <StatusBadge status={latest.status} />
          ) : (
            <span className="text-xs text-slate-400">no health checks yet</span>
          )}
          <span className="font-mono text-xs text-slate-400">
            #{deployment.project_id}
          </span>
        </div>
      </header>

      {latest ? (
        <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
          <HealthGauge score={latest.health_score} />
        </section>
      ) : (
        <p className="text-sm text-slate-400">
          No health checks recorded for this deployment yet.
        </p>
      )}

      {latest?.components && (
        <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
          <h2 className="text-sm font-semibold mb-4">Score breakdown</h2>
          <ScoreBreakdown components={latest.components} />
        </section>
      )}

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">Health check history</h2>

        {checks.length === 0 ? (
          <p className="text-sm text-slate-400">No health checks recorded.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-slate-400">
                <th scope="col" className="py-2">Checked</th>
                <th scope="col" className="py-2">Status</th>
                <th scope="col" className="py-2 text-right">Score</th>
                <th scope="col" className="py-2 text-right">p95 (ms)</th>
                <th scope="col" className="py-2 text-right">Error</th>
              </tr>
            </thead>
            <tbody>
              {[...checks].reverse().map((h) => (
                <tr key={h.id} className="border-t border-[#272F42]">
                  <td className="py-2.5 font-mono text-xs text-slate-400">
                    {h.checked_at.slice(0, 19).replace("T", " ")}
                  </td>
                  <td className="py-2.5">
                    <StatusBadge status={h.status} />
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {h.health_score.toFixed(1)}
                  </td>
                  <td className="py-2.5 text-right font-mono tabular-nums">
                    {h.response_time_ms != null
                      ? Math.round(h.response_time_ms)
                      : "—"}
                  </td>
                  <td className="py-2.5 text-right font-mono text-xs text-red-400">
                    {h.error ? "yes" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6">
        <h2 className="text-sm font-semibold mb-4">Rollback history</h2>
        {rollbacks.length === 0 ? (
          <p className="text-sm text-slate-400">No rollbacks triggered.</p>
        ) : (
          rollbacks.map((r) => (
            <div key={r.id} className="border-t border-[#272F42] py-3 text-sm">
              <span className={r.success ? "text-green-500" : "text-red-500"}>
                {r.success ? "recovered" : "failed"}
              </span>
              <span className="ml-3 text-slate-300">{r.reason}</span>
            </div>
          ))
        )}
      </section>

      {deployment.deployment_name ? (
        <section className="rounded-lg border border-slate-600 bg-[#1B2336] p-6 space-y-3">
          <div>
            <h2 className="text-sm font-semibold">Run a health check</h2>
            <p className="mt-1 text-xs text-slate-400">
              Probes the URL, scores it on availability, latency, errors and pod
              readiness, and rolls back automatically if it stays below
              threshold.
            </p>
            <p className="mt-1 font-mono text-[11px] text-slate-500">
              {deployment.namespace} / {deployment.deployment_name}
            </p>
          </div>
          <HealthCheckForm
            deploymentId={deployment.id}
            defaultUrl={
              deployment.node_port
                ? `http://localhost:${deployment.node_port}/health`
                : ""
            }
          />
        </section>
      ) : (
        <p className="text-xs text-slate-400">
          This deployment predates pipeline deployment, so it has no Kubernetes
          identity to monitor.
        </p>
      )}
    </main>
  );
}
