from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.rollback.rollback_engine import RollbackEngine
from app.models.health_check import HealthCheck
from app.models.rollback_event import RollbackEvent
from app.deployment.k8s_client import K8sClient
from app.deployment.post_deploy_verifier import PostDeployVerifier

router = APIRouter(prefix="/monitor", tags=["monitor"])

@router.get("/check-and-heal")
def check_and_heal(url: str, deployment_name: str, deployment_id: int, db: Session = Depends(get_db)):
    verifier = PostDeployVerifier()
    ready, desired = K8sClient().get_replica_counts(deployment_name)
    pod_readiness_score = (ready / desired * 100) if desired else 0.0

    probe, score_result = verifier.check_and_score(url, pod_readiness_score)

    health_check_record = HealthCheck(
        deployment_id=deployment_id,
        available=probe.failures == 0,
        response_time_ms=probe.p95_latency_ms,
        error="; ".join(probe.errors) or None,
        health_score=score_result["score"],
        status=score_result["status"],
        components=score_result["components"]
    )
    db.add(health_check_record)
    db.commit()
    db.refresh(health_check_record)

    rollback_engine = RollbackEngine()
    action_taken = None

    decision = rollback_engine.decide(
        score_result["score"], score_result["status"], 2,  True
    )
    if decision["should_rollback"]:
        rollback_result = rollback_engine.rollback(deployment_name)

        # save the rollback event to the database
        rollback_record = RollbackEvent(
            deployment_id=deployment_id,
            reason=f"Health score {score_result['score']} below threshold",
            success= rollback_result["rolled_back"],
        )
        db.add(rollback_record)
        db.commit()

        action_taken = rollback_result

    return {
        "raw_check": probe,
        "health_score": score_result,
        "action_taken": action_taken,
        "health_check_id": health_check_record.id,
    }