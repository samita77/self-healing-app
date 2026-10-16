import { type
    Deployment,
    HealthCheck,
    Project,
    RollbackEvent,
 } from "./types";

const BASE = "http://localhost:8000";

async function get<T>(path:string): Promise<T> {
    const res = await fetch(`${BASE}${path}`, { cache: "no-store"});
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
}

export const getProjects = () => get<Project[]>("/projects");
export const getProject = (id: number) => get<Project>(`/projects/${id}`);

export const getDeployments = (projectId?: number) => get<Deployment[]>(
   `/deployments${projectId ? `?project_id=${projectId}` : ""}`,
);

export const getDeployment = (id: number) => get<Deployment>(`/deployments/${id}`);

export const getHealthChecks = (id: number) => get<HealthCheck>(`/deployments/${id}/health-checks`);

export const getRollbackEvents = (id: number) => get<RollbackEvent>(`/deployments/${id}/rollback-events`);