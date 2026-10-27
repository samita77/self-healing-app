"""DORA metrics endpoint.

Computes the four DORA metrics from pipeline run and deployment data:

- Deployment frequency: deployments per week
- Lead time for changes: commit → deploy time (median)
- Mean time to recovery: failure → rollback time (median)
- Change failure rate: % of deployments that failed or were rolled back
"""

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_

from app.core.database import get_db
from app.models.user import User
from app.models.pipeline import PipelineRun
from app.models.deployment import Deployment
from app.models.project import Project
from app.models.rollback_event import RollbackEvent
from app.routes.auth import get_current_user
from datetime import datetime, timedelta

router = APIRouter(prefix="/dora", tags=["dora"])


@router.get("/metrics")
def dora_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Scope to the current user's projects (admin sees all)
    project_query = db.query(Project.id).filter(
        Project.owner_id == current_user.id
    )
    if current_user.role != "admin":
        project_query = project_query.filter(Project.owner_id == current_user.id)
    project_ids = [p[0] for p in project_query.all()]

    if not project_ids:
        return {
            "deployment_frequency": 0.0,
            "lead_time_hours": 0.0,
            "mttr_hours": 0.0,
            "change_failure_rate": 0.0,
            "note": "No projects found",
        }

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)

    # --- Deployment frequency: successful deployments per week ---
    deployments_last_week = (
        db.query(Deployment)
        .filter(
            Deployment.project_id.in_(project_ids),
            Deployment.status == "success",
            Deployment.deployed_at >= week_ago,
        )
        .count()
    )
    deployment_frequency = deployments_last_week / 7.0  # per day

    # --- Lead time: commit → deploy (median hours) ---
    # Join pipeline runs with deployments on project + commit sha prefix
    runs = (
        db.query(PipelineRun)
        .filter(
            PipelineRun.project_id.in_(project_ids),
            PipelineRun.status == "success",
            PipelineRun.finished_at.isnot(None),
        )
        .all()
    )
    deploys = (
        db.query(Deployment)
        .filter(
            Deployment.project_id.in_(project_ids),
            Deployment.status == "success",
            Deployment.deployed_at.isnot(None),
        )
        .all()
    )

    lead_times = []
    deploy_by_version = {d.version: d.deployed_at for d in deploys}
    for run in runs:
        version = run.commit_sha[:7]
        if version in deploy_by_version:
            delta = (deploy_by_version[version] - run.finished_at).total_seconds()
            if delta >= 0:
                lead_times.append(delta / 3600.0)  # hours
    lead_time_hours = (
        sum(lead_times) / len(lead_times) if lead_times else 0.0
    )

    # --- MTTR: failure → rollback (median hours) ---
    rollbacks = (
        db.query(RollbackEvent)
        .join(Deployment, RollbackEvent.deployment_id == Deployment.id)
        .filter(
            Deployment.project_id.in_(project_ids),
            RollbackEvent.success == True,
        )
        .all()
    )
    recovery_times = []
    for rb in rollbacks:
        deploy = next(
            (d for d in deploys if d.id == rb.deployment_id), None
        )
        if deploy and deploy.deployed_at and rb.triggered_at:
            delta = (rb.triggered_at - deploy.deployed_at).total_seconds()
            if delta >= 0:
                recovery_times.append(delta / 3600.0)
    mttr_hours = sum(recovery_times) / len(recovery_times) if recovery_times else 0.0

    # --- Change failure rate: % of deployments that failed ---
    total_deploys = (
        db.query(Deployment)
        .filter(Deployment.project_id.in_(project_ids))
        .count()
    )
    failed_deploys = (
        db.query(Deployment)
        .filter(
            Deployment.project_id.in_(project_ids),
            Deployment.status == "failed",
        )
        .count()
    )
    change_failure_rate = (
        (failed_deploys / total_deploys * 100) if total_deploys > 0 else 0.0
    )

    return {
        "deployment_frequency": round(deployment_frequency, 2),
        "lead_time_hours": round(lead_time_hours, 2),
        "mttr_hours": round(mttr_hours, 2),
        "change_failure_rate": round(change_failure_rate, 1),
    }
