import subprocess

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deployment.k8s_client import K8sClient
from app.models.deployment import Deployment
from app.models.project import Project
from app.models.user import User
from app.routes.auth import get_current_user
from app.services.deployment_service import DeploymentHealthService

router = APIRouter(prefix="/monitor", tags=["monitor"])


@router.get("/check-and-heal")
def check_and_heal(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Ownership is checked before any probing happens, so an unauthorised
    # caller gets no health data and no side effects on the cluster.
    owned = (
        db.query(Deployment)
        .join(Project, Deployment.project_id == Project.id)
        .filter(Deployment.id == deployment_id, Project.owner_id == current_user.id)
        .first()
    )
    if not owned:
        raise HTTPException(status_code=404, detail="Deployment not found")

    if not owned.deployment_name:
        raise HTTPException(
            status_code=409,
            detail="This deployment has no Kubernetes service to probe",
        )

    project = db.query(Project).filter(Project.id == owned.project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    k8s = K8sClient()
    namespace = owned.namespace or "default"
    node_port = owned.node_port or k8s.get_node_port(
        owned.deployment_name, namespace
    )
    if not node_port:
        raise HTTPException(
            status_code=503,
            detail="Could not find a NodePort for this deployment",
        )
    try:
        node_ip = k8s.get_minikube_ip()
    except (OSError, subprocess.SubprocessError, RuntimeError) as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Could not resolve the Minikube node address: {exc}",
        ) from exc

    health_path = (project.health_path or "/").strip()
    if not health_path.startswith("/") or health_path.startswith("//"):
        raise HTTPException(status_code=422, detail="Project health path must start with a single slash")
    url = f"http://{node_ip}:{node_port}{health_path}"

    # The safeguard was previously hardcoded to True, which meant it could never fire. It is a database fact: is there an earlier successful deployment of this project to restore?
    has_previous = (
        db.query(Deployment)
        .filter(
            Deployment.project_id == owned.project_id,
            Deployment.id < owned.id,
            Deployment.status == "success",
        )
        .first()
        is not None
    )

    service = DeploymentHealthService()
    ready, desired = k8s.get_replica_counts(owned.deployment_name, namespace)

    result = service.check_and_heal(
        url=url,
        deployment_name=owned.deployment_name,
        namespace=namespace,
        ready=ready,
        desired=desired,
        consecutive_failures=2,
        has_previous_version=has_previous,
        db=db,
        deployment_id=deployment_id,
        project_id=owned.project_id,
        check_window_s=3,
    )

    record = service.persist_health_check(
        db, deployment_id, result["probe"], result["health_score"]
    )

    if result["action_taken"]:
        service.persist_rollback(
            db,
            deployment_id,
            result["failure_reason"] or "unclassified",
            result["action_taken"]["rolled_back"],
        )

    return {
        "health_check_id": record.id,
        "health_score": result["health_score"],
        "endpoint_path": health_path,
        "decision": result["decision"],
        "failure_reason": result["failure_reason"],
        "action_taken": result["action_taken"],
        "trend": result.get("trend"),
    }
