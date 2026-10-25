import subprocess
from pathlib import Path

import yaml

class DeploymentManager:
    def __init__(self, manifest_dir: str):
        self.manifest_dir = Path(manifest_dir)

    def _load(self, filename: str) -> list[dict]:
        path = self.manifest_dir / filename
        with open(path) as f:
            # safe_load all, NOT safe load --backend.yaml contains two
            # documents separated by ---. safe_load silently returns only the first.
            return [doc for doc in yaml.safe_load_all(f) if doc]

    def build_manifest(self, image: str, template: str = "backend.yaml") -> list[dict]:
        docs = self._load(template)
        for doc in docs:
            if doc.get("kind") == "Deployment":
                for container in doc["spec"]["template"]["spec"]["containers"]:
                    # Never re-pull a tag that already exists - required for rollback,
                    # since the previous image is already in the node's local cache.
                    container["image"] = image
                    container["imagePullPolicy"] = "IfNotPresent"
        return docs

    def deploy(self, image: str, template: str = "backend.yaml") -> dict:
        docs = self.build_manifest(image, template)
        rendered = yaml.safe_dump_all(docs, sort_keys=False)

        print(f"[DeploymentManager] Applying image {image}")
        result = subprocess.run(
            ["kubectl", "apply", "-f", "-"],
            input=rendered,
            capture_output=True,
            text=True,
            timeout=120,
        )
        return{
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr[-2000:],
        }

    def rollback(self, deployment_name: str) -> dict:
        result = subprocess.run(
            ["kubectl", "rollout", "undo", f"deployment/{deployment_name}"],
            capture_output=True,
            text=True,
            timeout=120,
        )
        return {
            "success": result.returncode == 0,
            "stdout": result.stdout,
            "stderr": result.stderr[-2000:],
        }
