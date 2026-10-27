from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.deployment import Deployment
from app.models.health_check import HealthCheck
from app.models.project import Project
from app.models.rollback_event import RollbackEvent
from app.models.user import User
from app.routes.auth import get_current_user
from app.schemas.deployment_schema import DeploymentCreate, DeploymentResponse


router = APIRouter(prefix="/deployments", tags=["deployments"])


def _owned_deployment(
    deployment_id: int, current_user: User, db: Session
) -> Deployment:
    """Loads a deployment only if its project belongs to the caller.

    Deployments carry no owner column of their own - ownership is inherited
    from the project, so this joins through it.
    """
    deployment = (
        db.query(Deployment)
        .join(Project, Deployment.project_id == Project.id)
        .filter(Deployment.id == deployment_id, Project.owner_id == current_user.id)
        .first()
    )
    if not deployment:
        # 404 rather than 403 - a 403 would confirm the deployment exists.
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment


@router.post("/", response_model=DeploymentResponse)
def create_deployment(
    deployment: DeploymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    owned = (
        db.query(Project)
        .filter(
            Project.id == deployment.project_id,
            Project.owner_id == current_user.id,
        )
        .first()
    )
    if not owned:
        raise HTTPException(status_code=404, detail="Project not found")

    new_deployment = Deployment(
        project_id=deployment.project_id,
        version=deployment.version,
        status=deployment.status,
    )
    db.add(new_deployment)
    db.commit()
    db.refresh(new_deployment)
    return new_deployment


@router.get("/", response_model=list[DeploymentResponse])
def list_deployments(
    project_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Administrators see every deployment; users see only their own.

    Filtering is done in the query rather than after fetching, so a
    user's response never contains another tenant's rows.
    """
    query = db.query(Deployment).join(Project)

    if current_user.role != "admin":
        query = query.filter(Project.owner_id == current_user.id)

    if project_id is not None:
        query = query.filter(Deployment.project_id == project_id)

    return query.order_by(Deployment.deployed_at.desc()).all()


@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return _owned_deployment(deployment_id, current_user, db)


@router.get("/{deployment_id}/health-checks")
def list_health_checks(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_deployment(deployment_id, current_user, db)

    checks = (
        db.query(HealthCheck)
        .filter(HealthCheck.deployment_id == deployment_id)
        .order_by(HealthCheck.checked_at.asc())
        .all()
    )
    return [
        {
            "id": c.id,
            "deployment_id": c.deployment_id,
            "available": c.available,
            "response_time_ms": c.response_time_ms,
            "error": c.error,
            "health_score": c.health_score,
            "status": c.status,
            "checked_at": c.checked_at,
        }
        for c in checks
    ]


@router.get("/{deployment_id}/rollback-events")
def list_rollback_events(
    deployment_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_deployment(deployment_id, current_user, db)

    events = (
        db.query(RollbackEvent)
        .filter(RollbackEvent.deployment_id == deployment_id)
        .order_by(RollbackEvent.triggered_at.desc())
        .all()
    )
    return [
        {
            "id": e.id,
            "deployment_id": e.deployment_id,
            "reason": e.reason,
            "success": e.success,
            "triggered_at": e.triggered_at,
        }
        for e in events
    ]
