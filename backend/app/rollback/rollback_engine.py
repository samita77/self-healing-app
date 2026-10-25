import time

from app.deployment.k8s_client import K8sClient

class RollbackEngine:
    def __init__(self, threshold: float = 50, min_consecutive_failures: int = 2):
        self.k8s_client = K8sClient()
        self.threshold = threshold
        self.min_consecutive_failures = min_consecutive_failures

    @staticmethod
    def next_failure_count(consecutive: int, status: str) -> int:
        return consecutive + 1 if status == "FAILED" else 0

    def decide(self, health_score, status, consecutive_failures, has_previous_version: bool) -> dict:
        if status != "FAILED":
            return {"should_rollback": False,
                    "reason": f"status {status}, health {health_score} within tolerance",
                    "consecutive_failures": consecutive_failures}

        if not has_previous_version:
            return {"should_rollback": False,
                    "reason": ("deployment FAILED but this is the first version; " "nothing to restore, marked failed without rollback"),
                    "consecutive_failures": consecutive_failures}

        if consecutive_failures < self.min_consecutive_failures:
            return {"should_rollback": False,
                    "reason": (f"failure {consecutive_failures}/"
                               f"{self.min_consecutive_failures}, waiting to rule out a blip"),
                               "consecutive_failures": consecutive_failures}

        return {"should_rollback": True, 
                "reason": (f"health {health_score} below {self.threshold} across "
                           f"{consecutive_failures} consecutive windows"),
                "consecutive_failures": consecutive_failures}


    def rollback(self, deployment_name: str, namespace: str = "default") -> dict:
        started = time.monotonic()
        success = self.k8s_client.rollback_deployment(deployment_name, namespace)
        return {"rolled_back": success, "duration_s": round(time.monotonic() - started, 2)}