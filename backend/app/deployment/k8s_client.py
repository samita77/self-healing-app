import subprocess

class K8sClient:
    def apply_manifest(self, manifest_path: str) -> bool:
        result = subprocess.run(
            ["kubectl", "apply", "-f", manifest_path],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"[K8sClient] apply FAILED: \n{result.stderr}")
            return False
        print(f"[K8sClient] apply SUCCESS:\n{result.stdout}")
        return True

    def get_pod_status(self, label_selector: str) -> list[str]:
        result = subprocess.run(
            [
                "kubectl", "get", "pods",
                "-l", label_selector,
                "-o", "jsonpath={range .items[*]}{.status.phase}{\"\\n\"}{end}",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        return [line for line in result.stdout.strip().splitlines() if line]

    def rollback_deployment(self, deployment_name: str) -> bool:
        result = subprocess.run(
            ["kubectl", "rollout", "undo", f"deployment/{deployment_name}"],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[K8sClient] rollback FAILED: \n{result.stderr}")
            return False
        print(f"[K8sClient] rollback SUCCESS:\n{result.stdout}")
        return True

    def wait_for_rollout(self, deployment_name: str, timeout: int = 120) -> bool:
        result = subprocess.run(
            ["kubectl", "rollout", "status", f"deployment/{deployment_name}",
             f"--timeout={timeout}s"],
             capture_output=True,
             text=True,
             timeout= timeout + 15,
        )
        if result.returncode != 0:
            print(f"[K8sClient] rollout did NOT complete: \n{result.stdout}{result.stderr}")
            return False
        return True

    def get_replica_counts(self, deployment_name: str) -> tuple[int, int]:
        result = subprocess.run(
            ["kubectl", "get", "deployment", deployment_name, "-o", "jsonpath={.status.readyReplicas}/{.spec.replicas}"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        try:
            ready, desired = result.stdout.strip().split("/")
            return int(ready), int(desired)
        except (ValueError, AttributeError):
            return 0, 0