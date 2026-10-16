from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.deployment import Deployment
from app.models.health_check import HealthCheck
from app.models.rollback_event import RollbackEvent
from app.schemas.deployment_schema import DeploymentCreate, DeploymentResponse


router = APIRouter(prefix="/deployments", tags=["deployments"])

@router.post("/", response_model=DeploymentResponse)
def create_deployment(deployment: DeploymentCreate, db: Session = Depends(get_db)):
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
def list_deployments(project_id: int | None = None, db: Session = Depends(get_db)):
    query = db.query(Deployment)
    if project_id is not None:
        query = query.filter(Deployment.project_id == project_id)
    return query.order_by(Deployment.deployed_at.desc()).all()

@router.get("/{deployment_id}", response_model=DeploymentResponse)
def get_deployment(deployment_id: int, db: Session = Depends(get_db)):
    deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
    if not deployment:
        raise HTTPException(status_code=404, detail="Deployment not found")
    return deployment

@router.get("/{deployment_id}/health-checks")
def list_health_checks(deployment_id:int, db: Session = Depends(get_db)):
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
def list_rollback_events(deployment_id: int, db: Session = Depends(get_db)):
    events = (
        db.query(RollbackEvent)
        .filter(RollbackEvent.deployment_id == deployment_id)
        .order_by(RollbackEvent.triggered_at.desc())
        .all()
    )
    return[
        {
            "id": e.id,
            "deployment_id": e.deployment_id,
            "reason": e.reason,
            "success": e.success,
            "triggered_at": e.triggered_at,
        }
        for e in events
    ]
    