from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.deployment import Deployment
from app.models.health_check import HealthCheck
from app.models.pipeline import PipelineRun
from app.models.project import Project
from app.models.rollback_event import RollbackEvent
from app.models.user import User
from app.routes.auth import get_current_user, require_admin
from app.schemas.project_schema import ProjectCreate, ProjectResponse, ProjectUpdate

router = APIRouter(prefix="/projects", tags=["projects"])


@router.post("/", response_model=ProjectResponse)
def create_project(
    project: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_project = Project(
        name=project.name,
        repo_url=project.repo_url,
        docker_image_name=project.docker_image_name,
        owner_id=current_user.id,
    )
    db.add(new_project)
    db.commit()
    db.refresh(new_project)
    return new_project


@router.get("/", response_model=list[ProjectResponse])
def list_projects(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Administrators see every tenant's projects; users see only their own.

    Filtering happens in the query rather than after fetching, so a
    user's response never contains another tenant's rows.
    """
    query = db.query(Project)
    if current_user.role != "admin":
        query = query.filter(Project.owner_id == current_user.id)
    return query.order_by(Project.id.desc()).all()


@router.get("/{project_id}", response_model=ProjectResponse)
def get_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.put("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    update: ProjectUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    if update.repo_url is not None:
        project.repo_url = update.repo_url
    if update.container_port is not None:
        project.container_port = update.container_port
    if update.health_path is not None:
        project.health_path = update.health_path
    if update.replicas is not None:
        project.replicas = update.replicas
    if update.secret_refs is not None:
        project.secret_refs = update.secret_refs

    db.commit()
    db.refresh(project)
    return project


@router.delete("/{project_id}", status_code=204)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # Cascade delete: pipeline runs, deployments (with health checks and
    # rollback events), then the project itself.
    deployment_ids = db.query(Deployment.id).filter(
        Deployment.project_id == project_id
    ).subquery()
    db.query(RollbackEvent).filter(
        RollbackEvent.deployment_id.in_(deployment_ids)
    ).delete(synchronize_session=False)
    db.query(HealthCheck).filter(
        HealthCheck.deployment_id.in_(deployment_ids)
    ).delete(synchronize_session=False)
    db.query(Deployment).filter(Deployment.project_id == project_id).delete(
        synchronize_session=False
    )
    db.query(PipelineRun).filter(PipelineRun.project_id == project_id).delete(
        synchronize_session=False
    )
    db.delete(project)
    db.commit()
    return None


@router.get("/{project_id}/runtime-logs")
def runtime_logs(
    project_id: int,
    deployment_id: int | None = None,
    pod: str | None = None,
    container: str | None = None,
    tail: int = 500,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """List eligible pods or return a bounded container log snapshot."""
    project_query = db.query(Project).filter(Project.id == project_id)
    if current_user.role != "admin":
        project_query = project_query.filter(Project.owner_id == current_user.id)
    project = project_query.first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    deployments = db.query(Deployment).filter(
        Deployment.project_id == project_id,
        Deployment.namespace.isnot(None),
        Deployment.deployment_name.isnot(None),
    )
    deployment = deployments.filter(Deployment.id == deployment_id).first() if deployment_id else deployments.order_by(Deployment.deployed_at.desc()).first()
    if not deployment:
        return {"pods": [], "logs": None}
    from app.deployment.k8s_client import K8sClient
    client = K8sClient()
    try:
        pods = client.list_pods(deployment.namespace, deployment.deployment_name)
        if not pod:
            return {"deployment_id": deployment.id, "pods": pods, "logs": None}
        if pod not in {item["name"] for item in pods}:
            raise HTTPException(status_code=404, detail="Pod not found for this deployment")
        available_containers = next((item["containers"] for item in pods if item["name"] == pod), [])
        selected_container = container or (available_containers[0] if available_containers else None)
        if not selected_container or selected_container not in available_containers:
            raise HTTPException(status_code=404, detail="Container not found for this pod")
        return {"deployment_id": deployment.id, "pods": pods, "pod": pod, "container": selected_container,
                "logs": client.pod_logs(deployment.namespace, pod, selected_container, max(1, min(tail, 1000)))}
    except RuntimeError as exc:
        raise HTTPException(status_code=502, detail=str(exc)) from exc
