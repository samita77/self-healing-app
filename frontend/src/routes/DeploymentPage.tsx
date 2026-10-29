import { ArrowLeft, ArrowClockwise, Clock, Cpu, Package, Pulse, WarningCircle } from "@phosphor-icons/react";
import { Link, useParams } from "react-router";
import HealthCheckForm from "@/components/HealthCheckForm";
import HealthGauge from "@/components/HealthGauge";
import NotFoundContent from "@/components/NotFoundContent";
import ScoreBreakdown from "@/components/ScoreBreakdown";
import StatusBadge from "@/components/StatusBadge";
import { useDeployment, useHealthChecks, useRollbackEvents } from "@/hooks/useDeployments";
import { useProject } from "@/hooks/useProjects";

function DeploymentSkeleton() {
  return <div className="space-y-4" aria-busy="true" aria-label="Loading deployment">
    <div className="h-8 w-64 animate-pulse rounded-lg bg-surface" />
    <div className="h-28 animate-pulse rounded-xl bg-card" />
    <div className="h-64 animate-pulse rounded-xl bg-card" />
  </div>;
}

function Metric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Package }) {
  return <div className="min-w-0 rounded-lg bg-surface px-3 py-2.5">
    <div className="flex items-center gap-1.5 text-xs text-ink-muted"><Icon size={14} aria-hidden="true" />{label}</div>
    <p className="mt-1 truncate font-mono text-sm font-medium tabular-nums text-ink" title={value}>{value}</p>
  </div>;
}

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function deploymentStatus(status: string): "SUCCESSFUL" | "WARNING" | "FAILED" {
  const normalized = status.toUpperCase();
  if (normalized === "SUCCESS" || normalized === "SUCCESSFUL") return "SUCCESSFUL";
  if (normalized === "WARNING") return "WARNING";
  return "FAILED";
}

export default function DeploymentPage() {
  const params = useParams();
  const deploymentId = Number(params.id);
  const isValidId = Number.isInteger(deploymentId) && deploymentId > 0;
  const deploymentQuery = useDeployment(deploymentId);
  const projectQuery = useProject(deploymentQuery.data?.project_id ?? Number.NaN);
  const checksQuery = useHealthChecks(deploymentId);
  const rollbacksQuery = useRollbackEvents(deploymentId);

  if (!isValidId) return <NotFoundContent />;
  if (deploymentQuery.isLoading) return <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6"><DeploymentSkeleton /></main>;
  if (deploymentQuery.isError || !deploymentQuery.data) return <NotFoundContent />;

  const deployment = deploymentQuery.data;
  const checks = [...(checksQuery.data ?? [])].sort((a, b) => a.checked_at.localeCompare(b.checked_at));
  const latest = checks.at(-1) ?? null;
  const successfulChecks = checks.filter((check) => check.available).length;
  const availability = checks.length ? `${Math.round((successfulChecks / checks.length) * 100)}%` : "—";
  const averageLatency = checks.reduce((sum, check) => sum + (check.response_time_ms ?? 0), 0) /
    (checks.filter((check) => check.response_time_ms != null).length || 1);
  const rollbacks = [...(rollbacksQuery.data ?? [])].sort((a, b) => b.triggered_at.localeCompare(a.triggered_at));

  return <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <Link to="/deployments" className="mb-2 inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink"><ArrowLeft size={14} aria-hidden="true" /> All deployments</Link>
        <h1 className="truncate text-xl font-semibold tracking-tight">Deployment <span className="font-mono">{deployment.version}</span></h1>
        <p className="mt-1 text-xs text-ink-muted">{projectQuery.data?.name ?? `Project #${deployment.project_id}`} <span className="px-1">·</span> Deployed {formatDate(deployment.deployed_at)}</p>
      </div>
      <div className="flex items-center gap-2">
        <StatusBadge status={latest?.status ?? deploymentStatus(deployment.status)} />
        <Link to={`/projects/${deployment.project_id}`} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-surface">Open project</Link>
      </div>
    </header>

    <section className="grid gap-3 rounded-xl border border-border bg-card p-3 sm:grid-cols-[minmax(190px,0.8fr)_2fr] sm:p-4" aria-label="Deployment summary">
      <div className="flex items-center justify-center border-b border-border pb-3 sm:border-b-0 sm:border-r sm:pb-0 sm:pr-4">
        {latest ? <HealthGauge score={latest.health_score} /> : <div className="py-5 text-center text-sm text-ink-muted"><Pulse size={22} className="mx-auto mb-2" aria-hidden="true" />No health score yet</div>}
      </div>
      <div className="grid content-center grid-cols-2 gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <Metric label="Availability" value={availability} icon={Pulse} />
        <Metric label="Latest latency" value={latest?.response_time_ms != null ? `${Math.round(latest.response_time_ms)} ms` : "—"} icon={Clock} />
        <Metric label="Checks recorded" value={checksQuery.isLoading ? "Loading…" : String(checks.length)} icon={ArrowClockwise} />
        <Metric label="Mean latency" value={checks.some((check) => check.response_time_ms != null) ? `${Math.round(averageLatency)} ms` : "—"} icon={Cpu} />
      </div>
    </section>

    {checksQuery.isError && <div role="alert" className="rounded-lg border border-failed/30 bg-failed-subtle px-3 py-2 text-sm text-failed">Health check history could not be loaded.</div>}
    {rollbacksQuery.isError && <div role="alert" className="rounded-lg border border-failed/30 bg-failed-subtle px-3 py-2 text-sm text-failed">Rollback history could not be loaded.</div>}

    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(300px,0.8fr)]">
      <div className="space-y-4">
        {latest?.components && <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-3 py-2.5"><h2 className="text-sm font-semibold">Health score breakdown</h2><p className="mt-0.5 text-xs text-ink-muted">Signals and weighted contribution to the latest score.</p></div>
          <div className="overflow-x-auto px-3 pb-2"><ScoreBreakdown components={latest.components} /></div>
        </section>}

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-3 py-2.5"><div><h2 className="text-sm font-semibold">Health check history</h2><p className="mt-0.5 text-xs text-ink-muted">Latest probe results for this deployment.</p></div><span className="rounded-md bg-surface px-2 py-1 font-mono text-xs text-ink-muted">{checks.length}</span></div>
          {checksQuery.isLoading ? <div className="space-y-2 p-3" aria-busy="true"><div className="h-7 animate-pulse rounded bg-surface" /><div className="h-7 animate-pulse rounded bg-surface" /></div> : checks.length === 0 ? <p className="px-3 py-5 text-sm text-ink-muted">No checks have run yet. Run one from the panel to start a history.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-sm">
            <thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted"><th scope="col" className="px-3 py-2 font-medium">Checked</th><th scope="col" className="px-3 py-2 font-medium">Status</th><th scope="col" className="px-3 py-2 text-right font-medium">Score</th><th scope="col" className="px-3 py-2 text-right font-medium">Latency</th><th scope="col" className="px-3 py-2 font-medium">Details</th></tr></thead>
            <tbody>{[...checks].reverse().map((check) => <tr key={check.id} className="border-t border-border align-top"><td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-ink-muted">{formatDate(check.checked_at)}</td><td className="px-3 py-2"><StatusBadge status={check.status} /></td><td className="px-3 py-2 text-right font-mono tabular-nums">{check.health_score.toFixed(1)}</td><td className="px-3 py-2 text-right font-mono tabular-nums">{check.response_time_ms != null ? `${Math.round(check.response_time_ms)} ms` : "—"}</td><td className="max-w-[260px] px-3 py-2 text-xs text-failed">{check.error || "—"}</td></tr>)}</tbody>
          </table></div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="border-b border-border px-3 py-2.5"><h2 className="text-sm font-semibold">Rollback events</h2><p className="mt-0.5 text-xs text-ink-muted">Automatic recovery actions linked to health checks.</p></div>
          {rollbacksQuery.isLoading ? <div className="h-14 animate-pulse bg-surface" /> : rollbacks.length === 0 ? <p className="px-3 py-4 text-sm text-ink-muted">No rollback events recorded.</p> : <div className="divide-y divide-border">{rollbacks.map((rollback) => <div key={rollback.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2.5 text-sm"><div className="flex min-w-0 gap-2"><WarningCircle size={16} className={rollback.success ? "mt-0.5 shrink-0 text-healthy" : "mt-0.5 shrink-0 text-failed"} aria-hidden="true" /><div className="min-w-0"><p className={rollback.success ? "font-medium text-healthy" : "font-medium text-failed"}>{rollback.success ? "Recovery succeeded" : "Recovery failed"}</p><p className="mt-0.5 break-words text-xs text-ink-muted">{rollback.reason}</p></div></div><time className="whitespace-nowrap font-mono text-[11px] text-ink-muted">{formatDate(rollback.triggered_at)}</time></div>)}</div>}
        </section>
      </div>

      <aside className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-3">
          <div className="flex items-start gap-2"><div className="rounded-md bg-primary-subtle p-1.5 text-primary"><Pulse size={16} aria-hidden="true" /></div><div><h2 className="text-sm font-semibold">Run a health check</h2><p className="mt-0.5 text-xs leading-5 text-ink-muted">Probe this workload now. A failed check can trigger automated recovery.</p></div></div>
          {deployment.deployment_name ? <>
          <div className="grid grid-cols-2 gap-2"><Metric label="Kubernetes deployment" value={deployment.deployment_name} icon={Package} /><Metric label="Namespace" value={deployment.namespace ?? "default"} icon={Cpu} /><Metric label="Node port" value={deployment.node_port ? String(deployment.node_port) : "Not published"} icon={Clock} /><Metric label="Deployed" value={new Date(deployment.deployed_at).toLocaleDateString()} icon={Pulse} /></div>
            <HealthCheckForm deploymentId={deployment.id} />
          </> : <p className="rounded-lg bg-surface p-3 text-xs leading-5 text-ink-muted">This deployment has no Kubernetes identity, so active health probes are unavailable.</p>}
        </section>
      </aside>
    </div>
  </main>;
}
