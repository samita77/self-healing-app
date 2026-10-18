from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.deployment.k8s_client import K8sClient
from app.services.deployment_service import DeploymentHealthService

router = APIRouter(prefix="/monitor", tags=["monitor"])


@router.get("/check-and-heal")
def check_and_heal(
    url: str,
    deployment_name: str,
    deployment_id: int,
    db: Session = Depends(get_db),
):
    service = DeploymentHealthService()
    ready, desired = K8sClient().get_replica_counts(deployment_name)

    result = service.check_and_heal(
        url=url,
        deployment_name=deployment_name,
        ready=ready,
        desired=desired,
        consecutive_failures=2,
        has_previous_version=True,
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
