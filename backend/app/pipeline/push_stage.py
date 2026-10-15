import subprocess
from app.pipeline.pipeline_stage import PipelineStage
from app.services.docker_service import DockerService

class PushStage(PipelineStage):
    def __init__(self, docker:DockerService = None):
        super().__init__(name="Push")
        self.docker = docker or DockerService()

    def execute(self, context: dict) -> bool:
        ok = self.docker.push(context["docker_image_name"])
        print(f"[{self.name}] {'SUCCESS' if ok else 'FAILED'}")
        return ok