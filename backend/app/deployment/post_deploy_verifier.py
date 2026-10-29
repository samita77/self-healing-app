import time

from app.deployment.k8s_client import K8sClient
from app.health.health_monitor import HealthMonitor
from app.health.health_scorer import HealthScorer
from app.rollback.rollback_engine import RollbackEngine

class PostDeployVerifier:
    def __init__(self, window_s=30, interval_s=3, threshold=50,min_failures=2):
        self.window_s = window_s
        self.interval_s = interval_s
        self.k8s = K8sClient()
        self.monitor = HealthMonitor()
        self.scorer = HealthScorer()
        self.rollback_engine = RollbackEngine(threshold, min_failures)

    def _measure(self, url, deployment_name, weights=None):
        ready, desired = self.k8s.get_replica_counts(deployment_name)
        readiness = (ready / desired * 100) if desired else 0.0
        _, result = self.check_and_score(url, readiness, weights)
        result["pods"] = {"ready": ready, "desired": desired}
        return result

    def check_and_score(
        self,
        url: str,
        pod_readiness: float = 100.0,
        weights=None,
        duration_s: int | None = None,
        interval_s: int | None = None,
    ):
        probe = self.monitor.run_window(
            url,
            self.window_s if duration_s is None else duration_s,
            self.interval_s if interval_s is None else interval_s,
        )
        scorer = HealthScorer(weights=weights) if weights else self.scorer
        return probe, scorer.score(probe, pod_readiness)

    def verify_and_heal(self, url, deployment_name, has_previous_version=True, weights=None) -> dict:
        rollout_ok = self.k8s.wait_for_rollout(deployment_name)
        if not rollout_ok:
            return {"outcome": "FAILED",
                    "reason": "rollout never completed", 
                    "rolled_back": False,
                    "recovery_time_s": None}

        first = self._measure(url, deployment_name, weights)
        consecutive = RollbackEngine.next_failure_count(0, first["status"])
        decision = self.rollback_engine.decide(first["score"], first["status"], consecutive, has_previous_version)

        if not decision["should_rollback"]:
            return {"outcome": first["status"], 
                    "first_window": first,
                    "decision": decision,
                    "rolled_back": False,
                    "recovery_time_s": None}

        started = time.monotonic()
        rollback_result = self.rollback_engine.rollback(deployment_name)
        recovery_time = None

        if rollback_result["rolled_back"]:
            self.k8s.wait_for_rollout(deployment_name)
            second = self._measure(url, deployment_name, weights)
            recovery_time = round(time.monotonic() - started, 2)
            recovered = second["status"] != "FAILED"

        else:
            recovered = False
            second = None

        return {
            "outcome": "ROLLED_BACK" if recovered else "ROLLBACK_FAILED",
            "first_window": first,
            "post_rollback_window": second,
            "decision": decision,
            "rolled_back": rollback_result["rolled_back"],
            "recovery_time_s": recovery_time,
        }
