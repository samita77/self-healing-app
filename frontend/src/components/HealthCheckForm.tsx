import { useState } from "react";
import type { FormEvent } from "react";
import { useCheckHealth } from "@/hooks/useDeployments";
import { fallbackMessage, httpStatus } from "@/lib/errors";

export default function HealthCheckForm({
  deploymentId,
  defaultUrl = "",
}: {
  deploymentId: number;
  defaultUrl?: string;
}) {
  const checkHealth = useCheckHealth(deploymentId);
  const [url, setUrl] = useState(defaultUrl);
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmed = url.trim();
    if (!trimmed) return;

    setError("");
    try {
      await checkHealth.mutateAsync(trimmed);
    } catch (err) {
      const status = httpStatus(err);
      if (status === 401) setError("Your session expired. Please log in again.");
      else if (status) setError(`Health check failed (HTTP ${status})`);
      else setError(fallbackMessage(err));
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-2">
      <div className="flex gap-2">
        <input
          name="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="http://<minikube-ip>:<nodePort>/health"
          className="w-full rounded-lg border border-slate-600 bg-[#0F172A] px-3 py-2 font-mono text-xs focus:border-green-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={checkHealth.isPending}
          className="shrink-0 rounded-lg border border-slate-600 px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checkHealth.isPending ? "Checking..." : "Check health"}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </form>
  );
}
