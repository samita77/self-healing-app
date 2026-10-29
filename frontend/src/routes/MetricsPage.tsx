import { useState } from "react";
import { useQueries } from "@tanstack/react-query";
import type { EChartsOption } from "echarts";
import { Clock, Heartbeat, Pulse } from "@phosphor-icons/react";
import EChart from "@/components/ui/EChart";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import StatusBadge from "@/components/StatusBadge";
import { useDeployments } from "@/hooks/useDeployments";
import { endpoints } from "@/lib/api";
import { chart, baseCategoryAxis, baseGrid, baseTooltip, baseValueAxis } from "@/lib/chartTheme";

const GRAFANA = import.meta.env.VITE_GRAFANA_URL ?? "";
const PERIODS = [
  { id: "24h", label: "24 hours", ms: 24 * 60 * 60 * 1000 },
  { id: "7d", label: "7 days", ms: 7 * 24 * 60 * 60 * 1000 },
  { id: "30d", label: "30 days", ms: 30 * 24 * 60 * 60 * 1000 },
  { id: "all", label: "All time", ms: Infinity },
] as const;
type Period = (typeof PERIODS)[number]["id"];

function token(name: string, fallback: string) {
  return typeof document === "undefined" ? fallback : getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

function MetricCard({ label, value, note, icon: Icon }: { label: string; value: string; note: string; icon: typeof Pulse }) {
  return <div className="rounded-xl border border-border bg-card px-3 py-3">
    <div className="flex items-center justify-between gap-2"><p className="text-xs font-medium text-ink-muted">{label}</p><Icon size={16} className="text-ink-muted" aria-hidden="true" /></div>
    <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight">{value}</p><p className="mt-0.5 text-[11px] text-ink-muted">{note}</p>
  </div>;
}

function useHealthHistory() {
  const deployments = useDeployments();
  const deploymentList = deployments.data ?? [];
  const ids = deploymentList.map((deployment) => deployment.id);
  const checks = useQueries({ queries: ids.map((id) => ({ queryKey: ["deployments", id, "health-checks"] as const, queryFn: () => endpoints.healthChecks(id), enabled: !deployments.isLoading && !deployments.isError })) });
  const points = checks.flatMap((query) => query.data ?? []).sort((a, b) => a.checked_at.localeCompare(b.checked_at));
  return { deployments, checks, points };
}

export default function MetricsPage() {
  const [period, setPeriod] = useState<Period>("7d");
  const [now] = useState(() => Date.now());
  const { deployments, checks, points } = useHealthHistory();
  const selectedPeriod = PERIODS.find((item) => item.id === period)!;
  const cutoff = selectedPeriod.ms === Infinity ? -Infinity : now - selectedPeriod.ms;
  const visible = points.filter((point) => new Date(point.checked_at).getTime() >= cutoff);
  const latest = visible.at(-1) ?? null;
  const latencies = visible.flatMap((point) => point.response_time_ms == null ? [] : [point.response_time_ms]);
  const avgLatency = latencies.length ? latencies.reduce((sum, value) => sum + value, 0) / latencies.length : null;
  const availability = visible.length ? visible.filter((point) => point.available).length / visible.length * 100 : null;
  const avgScore = visible.length ? visible.reduce((sum, point) => sum + point.health_score, 0) / visible.length : null;
  const loading = deployments.isLoading || checks.some((query) => query.isLoading);
  const failed = deployments.isError || checks.some((query) => query.isError);
  const inkMuted = token("--color-ink-muted", chart.inkMuted);
  const grid = token("--color-border", chart.grid);
  const ink = token("--color-ink", chart.ink);
  const primary = token("--color-primary", chart.primary);
  const healthy = token("--color-healthy", chart.healthy);
  const labels = visible.map((point) => new Date(point.checked_at).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }));
  const xAxis = { ...baseCategoryAxis(labels), axisLine: { lineStyle: { color: grid } }, axisLabel: { color: inkMuted, hideOverlap: true, fontSize: 10, formatter: (_: string, index: number) => index % Math.max(1, Math.ceil(labels.length / 7)) === 0 ? labels[index] : "" } };
  const gridConfig = { ...baseGrid(), top: 22, left: 8, right: 18, bottom: 4 };
  const tooltip = { ...baseTooltip(), backgroundColor: token("--color-card", "#fff"), borderColor: grid, textStyle: { ...baseTooltip().textStyle, color: ink } };
  const yAxis = { ...baseValueAxis(), splitLine: { lineStyle: { color: grid } } };
  const latencyOption: EChartsOption = { animation: false, color: [primary], tooltip, grid: gridConfig, xAxis, yAxis: { ...yAxis, axisLabel: { color: inkMuted, formatter: (value: number) => `${value} ms` } }, series: [{ name: "Response time", type: "line", smooth: true, showSymbol: false, connectNulls: false, data: visible.map((point) => point.response_time_ms), lineStyle: { width: 2 }, areaStyle: { opacity: 0.08 } }] };
  const scoreOption: EChartsOption = { animation: false, color: [healthy], tooltip, grid: gridConfig, xAxis, yAxis: { ...yAxis, min: 0, max: 100, axisLabel: { color: inkMuted } }, series: [{ name: "Health score", type: "line", smooth: true, showSymbol: false, connectNulls: false, data: visible.map((point) => point.health_score), lineStyle: { width: 2 }, areaStyle: { opacity: 0.08 } }] };

  return <main className="mx-auto w-full max-w-7xl space-y-4 px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div><h1 className="text-xl font-semibold tracking-tight">Metrics</h1><p className="mt-1 text-sm text-ink-muted">Deployment health and response trends.</p></div>
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-card p-1" aria-label="Metrics time range" role="group">{PERIODS.map((item) => <button key={item.id} type="button" aria-pressed={period === item.id} onClick={() => setPeriod(item.id)} className={`rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${period === item.id ? "bg-primary text-white" : "text-ink-muted hover:bg-surface hover:text-ink"}`}>{item.label}</button>)}</div>
    </header>

    {failed && <div role="alert" className="rounded-lg border border-failed/30 bg-failed-subtle px-3 py-2 text-sm text-failed">Some metrics could not be loaded. Available data is still shown.</div>}
    <section className="grid grid-cols-2 gap-2 sm:grid-cols-4" aria-label="Metrics summary">
      <MetricCard label="Availability" value={availability == null ? "—" : `${availability.toFixed(1)}%`} note={`${visible.filter((point) => point.available).length} successful of ${visible.length} checks`} icon={Heartbeat} />
      <MetricCard label="Avg. response" value={avgLatency == null ? "—" : `${Math.round(avgLatency)} ms`} note={`${latencies.length} latency samples`} icon={Clock} />
      <MetricCard label="Avg. health score" value={avgScore == null ? "—" : avgScore.toFixed(1)} note={latest ? `Latest ${latest.health_score.toFixed(1)} / 100` : "No score samples"} icon={Pulse} />
      <MetricCard label="Deployments tracked" value={loading ? "…" : String(deployments.data?.length ?? 0)} note={`${visible.length} checks in ${selectedPeriod.label.toLowerCase()}`} icon={Pulse} />
    </section>

    {loading ? <div className="grid gap-3 lg:grid-cols-2" aria-busy="true" aria-label="Loading metrics"><div className="h-[300px] animate-pulse rounded-xl bg-card" /><div className="h-[300px] animate-pulse rounded-xl bg-card" /></div> : visible.length === 0 ? <Card><CardBody><EmptyState title="No health check data for this period" description="Run a health check from a deployment, or choose a wider time range." /></CardBody></Card> : <div className="grid gap-3 lg:grid-cols-2">
      <Card><CardHeader className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Response time</h2><p className="mt-0.5 text-xs text-ink-muted">Probe latency over time · milliseconds</p></div><span className="font-mono text-xs text-ink-muted">{latest?.response_time_ms != null ? `${Math.round(latest.response_time_ms)} ms latest` : "No sample"}</span></CardHeader><CardBody className="px-2 py-3 sm:px-3"><EChart option={latencyOption} height={260} label="Response time over time in milliseconds" /></CardBody></Card>
      <Card><CardHeader className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Health score</h2><p className="mt-0.5 text-xs text-ink-muted">Composite availability and readiness score · 0 to 100</p></div><span className="font-mono text-xs text-ink-muted">{latest ? `${latest.health_score.toFixed(1)} latest` : "No sample"}</span></CardHeader><CardBody className="px-2 py-3 sm:px-3"><EChart option={scoreOption} height={260} label="Deployment health score over time on a scale from 0 to 100" /></CardBody></Card>
    </div>}

    {!loading && visible.length > 0 && <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><h2 className="text-sm font-semibold">Recent health checks</h2><p className="mt-0.5 text-xs text-ink-muted">Tabular view of the latest samples for quick inspection.</p></div><span className="font-mono text-xs text-ink-muted">{visible.length} total</span></div></CardHeader><CardBody className="overflow-x-auto p-0"><table className="w-full min-w-[620px] text-sm"><thead><tr className="text-left text-[11px] uppercase tracking-wide text-ink-muted"><th scope="col" className="px-4 py-2 font-medium">Checked</th><th scope="col" className="px-4 py-2 font-medium">Deployment</th><th scope="col" className="px-4 py-2 font-medium">Status</th><th scope="col" className="px-4 py-2 text-right font-medium">Score</th><th scope="col" className="px-4 py-2 text-right font-medium">Latency</th></tr></thead><tbody>{[...visible].reverse().slice(0, 12).map((point) => <tr key={`${point.deployment_id}-${point.id}`} className="border-t border-border"><td className="whitespace-nowrap px-4 py-2 font-mono text-xs text-ink-muted">{new Date(point.checked_at).toLocaleString()}</td><td className="px-4 py-2 font-mono text-xs">#{point.deployment_id}</td><td className="px-4 py-2"><StatusBadge status={point.status} /></td><td className="px-4 py-2 text-right font-mono tabular-nums">{point.health_score.toFixed(1)}</td><td className="px-4 py-2 text-right font-mono tabular-nums">{point.response_time_ms == null ? "—" : `${Math.round(point.response_time_ms)} ms`}</td></tr>)}</tbody></table></CardBody></Card>}

    {GRAFANA && <Card><CardHeader><h2 className="text-sm font-semibold">Workload monitoring</h2><p className="mt-0.5 text-xs text-ink-muted">Live CPU, memory, and cluster telemetry.</p></CardHeader><CardBody className="p-2 sm:p-3"><iframe src={GRAFANA} title="Application metrics from Grafana" className="h-[60vh] min-h-[360px] w-full rounded-lg border border-border bg-card" loading="lazy" /></CardBody></Card>}
    {!GRAFANA && <p className="text-xs text-ink-muted">Live CPU and memory charts are available when <code className="rounded bg-surface px-1 py-0.5 font-mono">VITE_GRAFANA_URL</code> is configured.</p>}
  </main>;
}
