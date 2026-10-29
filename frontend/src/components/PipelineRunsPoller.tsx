import { usePipelineRuns } from "@/hooks/usePipelines";
import Button from "@/components/ui/Button";

export default function PipelineRunsPoller({ projectId, onOpenRun }: { projectId: number; onOpenRun?: (runId: number) => void }) {
  const { data: runs, isLoading, isError } = usePipelineRuns(projectId);

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 rounded-lg bg-card border border-border animate-pulse"
          />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-failed">Could not load pipeline runs.</p>;
  }

  if (!runs || runs.length === 0) {
    return <p className="text-sm text-ink-muted">No pipeline runs yet.</p>;
  }

  return (
    <div className="space-y-3">
      {runs.slice(0, 5).map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs">{r.commit_sha.slice(0, 7)}</span>
              <span className="text-xs text-ink0">
                {r.started_at ? new Date(r.started_at).toLocaleString() : "-"}
              </span>
            </div>
            <span
              className={`text-xs uppercase ${
                r.status === "success" ? "text-healthy" : "text-failed"
              }`}
            >
              {r.status}
            </span>
          </div>
          {onOpenRun && <Button size="sm" variant="ghost" className="mt-2" onClick={() => onOpenRun(r.id)}>View output</Button>}
          <ul className="mt-3 space-y-1">
            {r.stage_results.map((s) => (
              <li key={s.stage} className="flex items-center gap-2 text-xs">
                <span className={s.success ? "text-healthy" : "text-failed"}>
                  {s.success ? "PASS" : "FAIL"}
                </span>
                <span className="text-ink-muted">{s.stage}</span>
                {s.duration_s != null && (
                  <span className="font-mono text-ink-muted">{s.duration_s}s</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
