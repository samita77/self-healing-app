import { ArrowUp, Clock, FirstAidKit, RocketLaunch, WarningCircle } from "@phosphor-icons/react";
import { useDoraMetrics } from "@/hooks/useReferenceData";
import Card, { CardBody } from "@/components/ui/Card";
import EmptyState from "@/components/ui/EmptyState";
import Spinner from "@/components/ui/Spinner";

const metricMeta = [
  { key: "deployment_frequency", label: "Deployment frequency", suffix: "/day", note: "Successful deployments · 7 day average", icon: RocketLaunch, tone: "text-healthy", format: (v: number) => v.toFixed(2) },
  { key: "lead_time_hours", label: "Lead time for changes", suffix: "h", note: "Median commit to deployment", icon: Clock, tone: "text-primary", format: (v: number) => v.toFixed(1) },
  { key: "mttr_hours", label: "Mean time to recovery", suffix: "h", note: "Median failure to rollback", icon: FirstAidKit, tone: "text-warning", format: (v: number) => v.toFixed(1) },
  { key: "change_failure_rate", label: "Change failure rate", suffix: "%", note: "Failed deployments / total", icon: WarningCircle, tone: "text-failed", format: (v: number) => v.toFixed(1) },
] as const;

export default function DoraPage() {
  const { data: metrics, isLoading, isError } = useDoraMetrics();
  return <main className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
    <header><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Delivery insights</p><h1 className="mt-2 text-xl font-semibold tracking-tight">DORA metrics</h1><p className="mt-1 text-sm text-ink-muted">A concise view of software delivery performance.</p></header>
    {isLoading ? <div className="flex min-h-48 items-center justify-center"><Spinner label="Loading DORA metrics…" /></div> : isError || !metrics ? <EmptyState title="DORA metrics unavailable" description="The metrics service did not return data. Try again in a moment." /> : <>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="DORA metric summary">
        {metricMeta.map(({ key, label, suffix, note, icon: Icon, tone, format }) => <Card key={key} className="transition-shadow hover:shadow-md"><CardBody className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-ink-muted">{label}</p><p className={`mt-3 text-3xl font-semibold tracking-tight tabular-nums ${tone}`}>{format(metrics[key])}<span className="ml-1 text-base font-medium">{suffix}</span></p></div><span className="rounded-lg bg-surface p-2 text-ink-muted"><Icon size={20} aria-hidden="true" /></span></div><p className="mt-3 text-xs text-ink-muted">{note}</p></CardBody></Card>)}
      </section>
      <Card><CardBody className="flex items-start gap-3"><span className="rounded-lg bg-primary-subtle p-2 text-primary"><ArrowUp size={18} aria-hidden="true" /></span><div><h2 className="text-sm font-semibold">About these metrics</h2><p className="mt-1 max-w-3xl text-sm leading-6 text-ink-muted">These values are aggregate summaries returned by the DORA metrics endpoint. Historical time series are not available from the current API.</p></div></CardBody></Card>
    </>}
  </main>;
}
