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
    url: str,
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
    namespace = owned.namespace or "default"
    ready, desired = K8sClient().get_replica_counts(owned.deployment_name, namespace)

    result = service.check_and_heal(
        url=url,
        deployment_name=owned.deployment_name,
        namespace=namespace,
        ready=ready,
        desired=desired,
        consecutive_failures=2,
        has_previous_version=has_previous,
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
        "decision": result["decision"],
        "failure_reason": result["failure_reason"],
        "action_taken": result["action_taken"],
    }
