import { useState } from "react";
import type { FormEvent } from "react";
import { useCheckHealth } from "@/hooks/useDeployments";
import { fallbackMessage, httpStatus } from "@/lib/errors";
import StatusBadge from "@/components/StatusBadge";

export default function HealthCheckForm({ deploymentId }: { deploymentId: number }) {
  const checkHealth = useCheckHealth(deploymentId);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    checkHealth.reset();
    try {
      await checkHealth.mutateAsync();
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Health check failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  const result = checkHealth.data;
  return <form onSubmit={onSubmit} className="space-y-2">
    <button
      type="submit"
      disabled={checkHealth.isPending}
      className="w-full rounded-lg bg-primary px-3 py-2 text-sm font-medium text-white hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
    >
      {checkHealth.isPending ? "Checking service…" : "Run health check"}
    </button>
    {error && <p role="alert" className="text-xs text-failed">{error}</p>}
    {result && <div role="status" className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2">
      <div className="flex items-center gap-2"><StatusBadge status={result.health_score.status} /><span className="font-mono text-sm font-semibold tabular-nums">{result.health_score.score.toFixed(1)} / 100</span></div>
      <span className="text-xs text-ink-muted">Saved · {result.endpoint_path}</span>
    </div>}
  </form>;
}
