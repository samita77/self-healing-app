import HealthGauge from "@/components/HealthGauge";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import StatusBadge from "@/components/StatusBadge";
import {
  getDeployment,
  getHealthChecks,
  getRollbackEvents,
} from "@/lib/api";
import type { Status } from "@/lib/types";
import { notFound } from "next/navigation";

export default async function DeploymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const deploymentId = Number(id);

 const [deployment, checks, rollbacks] = await Promise.all([
    getDeployment(deploymentId).catch(() => null),
    getHealthChecks(deploymentId).catch(() => []),
    getRollbackEvents(deploymentId).catch(() => []),
 ])

 if (!deployment) notFound();

  const latest = checks.length > 0 ? checks[checks.length - 1] : null;

  return (
    <main className="p-10 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Deployment {deployment.version}
        </h1>
        <div className="flex items-center gap-3 text-sm">
          {latest ? (
            <StatusBadge status={latest.status as Status} />
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
    </main>
  );
}