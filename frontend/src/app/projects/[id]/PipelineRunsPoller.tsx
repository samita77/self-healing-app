"use client";

import { useEffect, useState } from "react";
import { PipelineRun } from "@/lib/types";

export default function PipelineRunsPoller({
  projectId,
  intervalMs = 10000,
}: {
  projectId: number;
  intervalMs?: number;
}) {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function fetchRuns() {
      const res = await fetch(`/api/pipelines/runs/${projectId}`, {
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
      });
      if (!cancelled && res.ok) {
        setRuns(await res.json());
        setLoading(false);
      }
    }

    fetchRuns();
    const timer = setInterval(fetchRuns, intervalMs);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [projectId, intervalMs]);

  if (loading) {
    return (
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-16 rounded-lg bg-[#1B2336] border border-slate-700 animate-pulse" />
        ))}
      </div>
    );
  }

  if (runs.length === 0) {
    return <p className="text-sm text-slate-400">No pipeline runs yet.</p>;
  }

  return (
    <div className="space-y-3">
      {runs.slice(0, 5).map((r) => (
        <div
          key={r.id}
          className="rounded-lg border border-slate-600 bg-[#1B2336] p-4"
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs">{r.commit_sha.slice(0, 7)}</span>
            <span
              className={`text-xs uppercase ${
                r.status === "success" ? "text-green-500" : "text-red-500"
              }`}
            >
              {r.status}
            </span>
          </div>
          <ul className="mt-3 space-y-1">
            {r.stage_results.map((s) => (
              <li key={s.stage} className="flex items-center gap-2 text-xs">
                <span
                  className={
                    s.success ? "text-green-500" : "text-red-500"
                  }
                >
                  {s.success ? "PASS" : "FAIL"}
                </span>
                <span className="text-slate-300">{s.stage}</span>
                {s.duration_s != null && (
                  <span className="font-mono text-slate-400">{s.duration_s}s</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
