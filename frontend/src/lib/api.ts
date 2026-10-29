import { handleUnauthorized, tokenStore } from "./session";
import type {
  Deployment,
  DoraMetrics,
  HealthCheck,
  LoginResponse,
  PipelineRun,
  Project,
  RollbackEvent,
  User,
} from "./types";

const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"
).replace(/\/$/, "");

export class ApiError extends Error {
  readonly status: number;
  readonly detail: string;

  constructor(status: number, detail: string) {
    super(detail || `Request failed (HTTP ${status})`);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  /** Auth endpoints must not trigger the global 401 redirect. */
  skipAuthRedirect?: boolean;
};

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuthRedirect, headers: initHeaders, ...init } = options;

  const headers = new Headers(initHeaders);
  headers.set("Content-Type", "application/json");

  const token = tokenStore.get();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
    cache: "no-store",
  });

  if (response.status === 401 && !skipAuthRedirect) {
    handleUnauthorized();
  }

  if (!response.ok) {
    let detail = "";
    try {
      const payload = (await response.json()) as { detail?: unknown };
      if (typeof payload.detail === "string") detail = payload.detail;
    } catch {
      // Non-JSON error body - fall back to the status line.
    }
    throw new ApiError(response.status, detail);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown, options?: { skipAuthRedirect?: boolean }) =>
    request<T>(path, { method: "POST", body, ...options }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, { method: "PUT", body }),
  delete: <T>(path: string) => request<T>(path, { method: "DELETE" }),
};

// ---------- endpoints ----------

export const endpoints = {
  // auth
  login: (email: string, password: string) =>
    api.post<LoginResponse>(
      "/auth/login",
      { email, password },
      { skipAuthRedirect: true },
    ),
  register: (payload: { email: string; full_name: string; password: string }) =>
    api.post<User>("/auth/register", payload, { skipAuthRedirect: true }),
  me: () => api.get<User>("/auth/me"),

  // projects
  projects: () => api.get<Project[]>("/projects/"),
  project: (id: number) => api.get<Project>(`/projects/${id}`),
  createProject: (payload: {
    name: string;
    repo_url: string;
    container_port: number;
    health_path: string;
  }) => api.post<Project>("/projects/", payload),
  updateProject: (
    id: number,
    payload: {
      repo_url?: string;
      container_port: number;
      health_path: string;
      replicas: number;
    },
  ) => api.put<Project>(`/projects/${id}`, payload),
  deleteProject: (id: number) => api.delete<void>(`/projects/${id}`),

  // deployments
  deployments: (projectId?: number) =>
    api.get<Deployment[]>(
      `/deployments/${projectId ? `?project_id=${projectId}` : ""}`,
    ),
  deployment: (id: number) => api.get<Deployment>(`/deployments/${id}`),
  healthChecks: (id: number) =>
    api.get<HealthCheck[]>(`/deployments/${id}/health-checks`),
  rollbackEvents: (id: number) =>
    api.get<RollbackEvent[]>(`/deployments/${id}/rollback-events`),

  // pipelines
  pipelineRuns: (projectId: number) =>
    api.get<PipelineRun[]>(`/pipelines/runs/${projectId}`),
  runPipeline: (projectId: number) =>
    api.post<unknown>(`/pipelines/run/${projectId}`),

  // monitoring
  checkAndHeal: (deploymentId: number, url: string) =>
    api.get<unknown>(
      `/monitor/check-and-heal?deployment_id=${deploymentId}` +
        `&url=${encodeURIComponent(url)}`,
    ),

  // admin
  users: () => api.get<User[]>("/users/"),
  dora: () => api.get<DoraMetrics>("/dora/metrics"),
};
