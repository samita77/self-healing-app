import subprocess
from app.pipeline.pipeline_stage import PipelineStage
from app.services.docker_service import DockerService

class BuildStage(PipelineStage):
    def __init__(self, docker: DockerService = None):
        super().__init__(name="Build")
        self.docker = docker or DockerService()

    def execute(self, context:dict) -> bool:
        ok = self.docker.build(context["repo_path"], context["docker_image_name"], context.get("log"))
        print(f"[{self.name}] {'SUCCESS' if ok else 'FAILED'}")
        return ok
