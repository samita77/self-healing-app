import subprocess
from app.services.slug import slugify

class DockerService:
    def __init__(self, registry: str = "localhost:5000"):
        self.registry = registry

    def build_tag(self, project_name: str, commit_sha: str) -> str:
        # Short SHA (7 chars) as an immutable tag.
        # Tagging by commit rather than "latest" is what makes rollback possible:
        # every deployed version has its own permanent tag.
        return f"{self.registry}/{slugify(project_name)}:{commit_sha[:7]}"

    def build(self, repo_path: str, image: str, on_output=None) -> bool:
        print(f"[DockerService] Building {image} from {repo_path}")
        result = subprocess.run(
            ["docker", "build", "-t", image, repo_path],
            capture_output=True,
            text=True,
            timeout=900,
        )
        if on_output: on_output((result.stdout or "") + (result.stderr or ""))
        if result.returncode != 0:
            print(f"[DockerService] build FAILED:\n{result.stderr[-2000:]}")
            return False
        print(f"[DockerService] build OK")
        return True

    def push(self, image: str, on_output=None) -> bool:
        print(f"[DockerService] Pushing {image}")
        result = subprocess.run(
            ["docker", "push", image],
            capture_output=True,
            text=True,
            timeout=300,
        )
        if on_output: on_output((result.stdout or "") + (result.stderr or ""))
        if result.returncode != 0:
            print(f"[DockerSerivce] push FAILED:\n{result.stderr[-2000:]}")
            return False
        return True

    def image_exists(self, image: str) -> bool:
        """Check the registry already has this tag - used before rollback."""
        result = subprocess.run(
            ["docker", "manifest", "inspect", image],
            capture_output=True,
            text=True,
            timeout=60
        )
        return result.returncode == 0