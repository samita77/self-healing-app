from app.deployment.k8s_client import K8sClient
from app.pipeline.pipeline_stage import PipelineStage


class VerifyStage(PipelineStage):
    def __init__(self, client: K8sClient | None = None, timeout: int = 120):
        super().__init__(name="Verify")
        self.client = client or K8sClient()
        self.timeout = timeout

    def execute(self, context: dict) -> bool:
        name = context.get("deployment_name")
        namespace = context.get("namespace", "default")
        if not name:
            raise RuntimeError("no deployment_name in context")

        # Blocks until the new ReplicaSet is available. This is what makes
        # "success" mean the pods came up, not that kubectl accepted the YAML.
        if not self.client.wait_for_rollout(name, self.timeout, namespace):
            raise RuntimeError(f"rollout of {name} did not complete in {self.timeout}s")

        ready, desired = self.client.get_replica_counts(name, namespace)
        if desired == 0 or ready < desired:
            raise RuntimeError(f"{ready}/{desired} replicas ready")

        print(f"[{self.name}] SUCCESS {ready}/{desired} ready")
        return True