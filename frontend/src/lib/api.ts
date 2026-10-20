import { headers } from "next/headers";
import { type
    Deployment,
    HealthCheck,
    PipelineRun,
    Project,
    RollbackEvent,
    User,
 } from "./types";

/**
 * Server Components cannot fetch a relative URL - fetch() rejects
 * '/api/projects' with ERR_INVALID_URL. The origin has to be derived from
 * the incoming request headers.
 *
 * A server-side fetch does NOT carry the browser's cookies automatically,
 * so they are forwarded explicitly. Without this the proxy sees an
 * unauthenticated request and every page renders empty.
 */
async function requestContext(): Promise<{ origin: string; cookie: string }> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  return {
    origin: `${proto}://${host}`,
    cookie: h.get("cookie") ?? "",
  };
}

async function get<T>(path: string): Promise<T> {
  const { origin, cookie } = await requestContext();

  const res = await fetch(`${origin}/api${path}`, {
    cache: "no-store",
    headers: cookie ? { Cookie: cookie } : {},
  });
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return res.json();
}

export const getProjects = () => get<Project[]>("/projects/");
export const getProject = (id: number) => get<Project>(`/projects/${id}`);

export const getDeployments = (projectId?: number) => get<Deployment[]>(
   `/deployments/${projectId ? `?project_id=${projectId}` : ""}`,
);

export const getDeployment = (id: number) => get<Deployment>(`/deployments/${id}`);

export const getHealthChecks = (id: number) => get<HealthCheck[]>(`/deployments/${id}/health-checks`);

export const getRollbackEvents = (id: number) => get<RollbackEvent[]>(`/deployments/${id}/rollback-events`);

export const getPipelineRuns = (projectId: number) =>
    get<PipelineRun[]>(`/pipelines/runs/${projectId}`);

export const getUsers = () => get<User[]>("/users/");
