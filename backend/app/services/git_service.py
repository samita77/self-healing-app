import shutil
import subprocess
from datetime import datetime
from pathlib import Path

class GitService:
    ALLOWED_SCHEMES = ("https://", "http://", "git@", "ssh://")

    def __init__(self, workspace_dir: str = "./workspace"):
        self.workspace_dir= Path(workspace_dir)

    def _validate_repo_url(self, repo_url: str) -> None:
        if not repo_url.startswith(self.ALLOWED_SCHEMES):
            raise ValueError(
                f"Unsupported repository URL scheme: {repo_url!r}. "
                f"Allowed: {self.ALLOWED_SCHEMES}"
            )

    def project_path(self, project_id: int) -> Path:
        return self.workspace_dir / f"project_{project_id}"

    def clone(self, repo_url: str, project_id: int) -> dict:
        self._validate_repo_url(repo_url)

        dest = self.project_path(project_id)
        if dest.exists():
            shutil.rmtree(dest)
        dest.parent.mkdir(parents=True, exist_ok=True)

        print(f"[GitService] Cloning {repo_url} -> {dest}")
        result = subprocess.run(
            ["git", "clone", repo_url, str(dest)],
            capture_output=True, 
            text=True,
            timeout=300,
        )
        if result.returncode != 0:
            raise RuntimeError(f"git clone failed: {result.stderr}")

        meta = subprocess.run(
            ["git", "-C", str(dest), "log", "-1", "--format=%H%n%cI"],
            capture_output=True,
            text=True,
            timeout=60,
            check=True,
        )

        sha, committed_at = meta.stdout.strip().splitlines()

        branch = subprocess.run(
            ["git", "-C", str(dest), "branch", "--show-current"],
            capture_output=True,
            text=True,
            timeout=60,
            check=True,
        ).stdout.strip()

        return {
            "commit_sha": sha,
            "committed_at": datetime.fromisoformat(committed_at),
            "branch": branch,
        }
