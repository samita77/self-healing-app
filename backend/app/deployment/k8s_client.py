import os
import subprocess

import yaml

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
    
    def apply_docs(self, docs: list[dict], timeout: int = 120) -> None:
        """Applies generated manifests. Raises so the pipeline records why."""
        rendered = yaml.safe_dump_all(docs, sort_keys=False)
        result = subprocess.run(
            ["kubectl", "apply", "-f", "-"],
            input=rendered,
            capture_output=True,
            text=True,
            timeout=timeout,
        )
        if result.returncode != 0:
            raise RuntimeError(result.stderr[-2000:] or "kubectl apply failed")

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

    def rollback_deployment(self, deployment_name: str, namespace: str = "default") -> bool:
        result = subprocess.run(
            ["kubectl", "rollout", "undo", f"deployment/{deployment_name}", "-n", namespace],
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            print(f"[K8sClient] rollback FAILED: \n{result.stderr}")
            return False
        print(f"[K8sClient] rollback SUCCESS:\n{result.stdout}")
        return True

    def wait_for_rollout(self, deployment_name: str, timeout: int = 120, namespace: str = "default") -> bool:
        result = subprocess.run(
            ["kubectl", "rollout", "status", f"deployment/{deployment_name}", "-n", namespace,
             f"--timeout={timeout}s"],
             capture_output=True,
             text=True,
             timeout= timeout + 15,
        )
        if result.returncode != 0:
            print(f"[K8sClient] rollout did NOT complete: \n{result.stdout}{result.stderr}")
            return False
        return True

    def get_replica_counts(self, deployment_name: str, namespace: str = "default") -> tuple[int, int]:
        result = subprocess.run(
            ["kubectl", "get", "deployment", deployment_name, "-n", namespace, "-o", "jsonpath={.status.readyReplicas}/{.spec.replicas}"],
            capture_output=True,
            text=True,
            timeout=30,
        )
        try:
            ready, desired = result.stdout.strip().split("/")
            return int(ready), int(desired)
        except (ValueError, AttributeError):
            return 0, 0

    def get_node_port(self, service_name: str, namespace: str = "default") -> int | None:
        """Returns the NodePort assigned to a Service, or None if not set."""
        result = subprocess.run(
            [
                "kubectl", "get", "svc", service_name, "-n", namespace,
                "-o", "jsonpath={.spec.ports[0].nodePort}",
            ],
            capture_output=True,
            text=True,
            timeout=30,
        )
        try:
            return int(result.stdout.strip())
        except (ValueError, AttributeError):
            return None

    def get_minikube_ip(self) -> str:
        """Resolve the active local Minikube node address for host-side probes."""
        configured = os.getenv("MINIKUBE_IP", "").strip()
        if configured:
            return configured
        result = subprocess.run(
            ["minikube", "ip"], capture_output=True, text=True, timeout=10
        )
        address = result.stdout.strip()
        if result.returncode != 0 or not address:
            detail = result.stderr.strip() or "Minikube did not return a node IP"
            raise RuntimeError(detail)
        return address
    def list_pods(self, namespace: str, deployment_name: str) -> list[dict]:
        import json
        result = subprocess.run(
            ["kubectl", "get", "pods", "-n", namespace, "-l", f"app={deployment_name}", "-o", "json"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode:
            raise RuntimeError(result.stderr[-1000:] or "Could not list pods")
        data = json.loads(result.stdout or "{}")
        return [{"name": item["metadata"]["name"], "phase": item.get("status", {}).get("phase", "Unknown"),
                 "containers": [c["name"] for c in item.get("spec", {}).get("containers", [])]}
                for item in data.get("items", [])]

    def pod_logs(self, namespace: str, pod: str, container: str, tail: int = 500) -> str:
        result = subprocess.run(
            ["kubectl", "logs", pod, "-n", namespace, "-c", container, f"--tail={tail}", "--timestamps=true"],
            capture_output=True, text=True, timeout=30,
        )
        if result.returncode:
            raise RuntimeError(result.stderr[-1000:] or "Could not fetch pod logs")
        return result.stdout[-200_000:]
