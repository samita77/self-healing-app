from app.deployment.post_deploy_verifier import PostDeployVerifier
from app.health.failure_classifier import FailureClassifier
from app.models.health_check import HealthCheck
from app.models.rollback_event import RollbackEvent
from app.models.deployment import Deployment
from app.rollback.rollback_engine import RollbackEngine
from app.health.trend_detector import TrendDetector
from app.rollback.rollback_selector import RollbackSelector


class DeploymentHealthService:
    """Business logic for monitoring and healing a deployment.

    Kept out of the route layer so it can be tested without a web
    server, a Kubernetes cluster or a database.
    """

    def __init__(self, verifier=None, rollback_engine=None, classifier=None,
                 trend_detector=None):
        self.verifier = verifier or PostDeployVerifier()
        self.rollback_engine = rollback_engine or RollbackEngine()
        self.classifier = classifier or FailureClassifier()
        self.trend_detector = trend_detector or TrendDetector()

    def check_and_heal(
        self,
        url: str,
        deployment_name: str,
        ready: int,
        desired: int,
        namespace: str = "default",
        consecutive_failures: int = 2,
        has_previous_version: bool = True,
        weights: dict | None = None,
        db=None,
        deployment_id: int | None = None,
        project_id: int | None = None,
        check_window_s: int | None = None,
    ) -> dict:
        readiness_score = (ready / desired * 100) if desired else 0.0
        probe, score = self.verifier.check_and_score(
            url,
            readiness_score,
            weights,
            duration_s=check_window_s,
            interval_s=1 if check_window_s is not None else None,
        )

        decision = self.rollback_engine.decide(
            score["score"],
            score["status"],
            consecutive_failures,
            has_previous_version,
        )

        # Update EWMA trend detector with latest probe metrics.
        trend_result = None
        if db is not None and deployment_id is not None:
            trend_result = self.trend_detector.update(
                deployment_id,
                probe.p95_latency_ms,
                probe.error_rate,
            )

        # Only classify when a rollback is actually about to happen. On a
        # healthy deployment there is nothing to diagnose.
        failure_reason = None
        action_taken = None
        if decision["should_rollback"]:
            failure_reason = self.classifier.classify(
                components=score.get("components") or {},
                ready=ready,
                desired=desired,
                p95_ms=probe.p95_latency_ms,
            )
            # Select rollback target: known-good version first, then fallback.
            if db is not None and project_id is not None:
                selector = RollbackSelector(db)
                target, selector_reason = selector.choose(
                    project_id, deployment_id
                )
                action_taken = self.rollback_engine.rollback(
                    deployment_name,
                    namespace,
                    target_deployment_name=target.deployment_name if target else None,
                    target_namespace=target.namespace if target else None,
                )
                combined_reason = (
                    f"{failure_reason}; {selector_reason}"
                    if selector_reason else failure_reason
                )
                failure_reason = combined_reason

        return {
            "probe": probe,
            "health_score": score,
            "decision": decision,
            "failure_reason": failure_reason,
            "action_taken": action_taken,
            "trend": trend_result,
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
            components=score.get("components"),
        )
        db.add(record)
        deployment = db.query(Deployment).filter(Deployment.id == deployment_id).first()
        if deployment:
            deployment.health_score = score["score"]
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
