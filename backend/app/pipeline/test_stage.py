import subprocess
from pathlib import Path

from app.pipeline.pipeline_stage import PipelineStage

class TestStage(PipelineStage):
    def __init__(self):
        super().__init__(name="Test")

    def execute(self, context:dict) -> bool:
        repo_path = Path(context["repo_path"]).resolve()
        test_dir = repo_path / "tests"

        if not test_dir.is_dir():
            print(f"[{self.name}] SKIPPED - no tests/ directory in repository")
            return True

        print(f"[{self.name}] Running test suite in {repo_path}")
        result = subprocess.run(
            ["node", "--test"],
            cwd=str(repo_path),
            capture_output=True,
            text=True,
            timeout=300,
        )

        # Keep only the summary - a failing suite can emit thousands of lines
        output = (result.stdout or "") + (result.stderr or "")
        print(output[-4000:])

        if result.returncode != 0:
            print(f"[{self.name}] FAILED")
            return False

        print(f"[{self.name}] PASSED")
        return True