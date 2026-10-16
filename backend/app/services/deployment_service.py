from app.deployment.post_deploy_verifier import PostDeployVerifier
from app.models.health_check import HealthCheck
from app.models.rollback_event import RollbackEvent
from app.rollback.rollback_engine import RollbackEngine

class DeploymentHealthService:
    """Business logic for monitoring and healing a deployment.
    
    Kept out of route layer so it can be tested without a web server."""

    def __init__(self, verifier=None, rollback_engine=None):
        self.verifier = verifier or PostDeployVerifier()
        self.rollback_engine = rollback_engine or RollbackEngine()

        def check_and_heal(self, url, deployment_name, deployment_id, consecutive_failures=2, has_previous_version=True, weights=None) -> dict:
            probe, score = self.verifier.check_and_score(url, weights=weights)

            decision = self.rollback_engine.decide(
                score["score"], score["status"],
                consecutive_failures, has_previous_version
            )

            action_taken = None
            if decision["should_rollback"]:
                action_taken = self.rollback_engine.rollback(deployment_name)

            return {
                "probe": probe,
                "health_score": score,
                "decision": decision,
                "action_taken": action_taken,
            }

        @staticmethod
        def persist_health_check(db, deployment_id, probe, score) -> HealthCheck:
            record = HealthCheck(
                deployment_id=deployment_id,
                available=probe.failures == 0,
                response_time_ms=probe.p95_latency_ms,
                error="; ".join(probe.errors) or None,
                health_score=score["score"],
                status=score["status"],
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record

        @staticmethod
        def persist_rollback(db, deployment_id, reason, success) -> RollbackEvent:
            record = RollbackEvent(
                deployment_id=deployment_id,
                reason=reason,
                success=success,
            )
            db.add(record)
            db.commit()
            db.refresh(record)
            return record