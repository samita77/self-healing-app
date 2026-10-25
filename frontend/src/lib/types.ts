export type Status = "SUCCESSFUL" | "WARNING" | "FAILED";

export interface ScoreComponents {
    S_availability: number;
    R_response_time: number;
    E_error_rate: number;
    P_pod_readiness: number;
}

export interface Project {
    id: number;
    name: string;
    repo_url: string;
    docker_image_name: string;
    created_at: string;
}

export interface Deployment {
    id: number;
    project_id: number;
    version: string;
    status: string;
    namespace?: string | null;
    deployment_name?: string | null;
    health_score: number | null;
    deployed_at: string;
}

export interface HealthCheck{
    id: number;
    deployment_id: number;
    available: boolean;
    response_time_ms: number | null;
    error: string | null;
    health_score: number;
    status: Status;
    components: ScoreComponents | null;
    checked_at: String;
}

export interface RollbackEvent {
    id: number;
    deployment_id: number;
    reason: string;
    success: boolean;
    triggered_at: string;
}

export interface StageResult {
    stage: string;
    success: boolean;
    state?: string;
    duration_s?: number | null;
    error?: string | null;
}

export interface PipelineRun {
    id: number;
    project_id: number;
    commit_sha: string;
    branch: string;
    status: string;
    failed_stage?: string | null;
    duration_seconds?: number | null;
    stage_results: StageResult[];
    started_at?: string | null;
    finished_at?: string | null;
}

export interface User {
    id: number;
    email: string;
    full_name: string;
    role: "admin" | "developer";
    created_at: string;
}