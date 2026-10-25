from app.deployment.k8s_client import K8sClient
from app.deployment.manifest_builder import ManifestBuilder
from app.pipeline.pipeline_stage import PipelineStage


class DeployStage(PipelineStage):
    def __init__(self, builder: ManifestBuilder | None = None,
                 client: K8sClient | None = None):
        super().__init__(name="Deploy")
        self.builder = builder or ManifestBuilder()
        self.client = client or K8sClient()

    def execute(self, context: dict) -> bool:
        project = context.get("project")
        if project is None:
            raise RuntimeError("no project in context")

        name = self.builder.name(project)
        docs = self.builder.build(project, context["docker_image_name"])
        self.client.apply_docs(docs)

        context["deployment_name"] = name
        context["namespace"] = name
        context["deployed_image"] = context["docker_image_name"]

        print(f"[{self.name}] SUCCESS -> {name}")
        return True