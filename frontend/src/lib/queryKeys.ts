export const queryKeys = {
  auth: ["auth", "me"] as const,
  projects: ["projects"] as const,
  project: (id: number) => ["projects", id] as const,
  deployments: (projectId?: number) => ["deployments", projectId ?? "all"] as const,
  deployment: (id: number) => ["deployments", "detail", id] as const,
  healthChecks: (id: number) => ["deployments", id, "health-checks"] as const,
  rollbackEvents: (id: number) => ["deployments", id, "rollback-events"] as const,
  pipelineRuns: (projectId: number) => ["pipelines", "runs", projectId] as const,
  users: ["users"] as const,
  dora: ["dora"] as const,
};
