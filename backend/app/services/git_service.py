import ipaddress
import shutil
import socket
import subprocess
from datetime import datetime
from pathlib import Path
from urllib.parse import urlparse

class GitService:
    ALLOWED_SCHEMES = ("https://", "ssh://", "git@")

    # Anything not globally routable. Cloning from these means the pipeline
    # acts as an SSRF proxy: it can read cloud metadata (169.254.169.254) and
    # probe services that are not reachable from outside the host.
    BLOCKED_NETS = tuple(
        ipaddress.ip_network(n)
        for n in (
            "10.0.0.0/8", "172.16.0.0/12", "192.168.0.0/16",
            "127.0.0.0/8", "169.254.0.0/16", "0.0.0.0/8",
            "::1/128", "fc00::/7", "fe80::/10",
        )
    )

    def __init__(self, workspace_dir: str = "./workspace"):
        self.workspace_dir = Path(workspace_dir)

    def _validate_repo_url(self, repo_url: str) -> None:
        if not repo_url.startswith(self.ALLOWED_SCHEMES):
            raise ValueError(
                f"Unsupported repository URL scheme: {repo_url!r}. "
                f"Allowed: {self.ALLOWED_SCHEMES}"
            )

        # scp-like syntax (git@host:path) has no scheme to parse.
        if repo_url.startswith("git@"):
            host = repo_url.split("@", 1)[1].split(":", 1)[0]
        else:
            host = urlparse(repo_url).hostname or ""

        if not host:
            raise ValueError(f"Could not determine host from {repo_url!r}")

        try:
            resolved = socket.getaddrinfo(host, None)
        except socket.gaierror as exc:
            raise ValueError(f"Could not resolve repository host {host!r}") from exc

        for info in resolved:
            ip = ipaddress.ip_address(info[4][0])
            if any(ip in net for net in self.BLOCKED_NETS):
                raise ValueError(
                    f"Repository host {host!r} resolves to a private address ({ip})"
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
