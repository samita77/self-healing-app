import re
from app.services.slug import slugify

class ManifestBuilder:
    """Generates Kubernetes manifests for any registered project.

    Nothing here is specific to a particular repository. Inputs are the
    Project row and the image the pipeline built.
    """

    def name(self, project) -> str:
        """Stable, unique, RFC-1123 name for this project.

        The numeric id is appended deliberately: `metadata.name` IS the
        identity of a Deployment, so two projects that slugify alike
        ("Todo Test" and "todo-test") would otherwise share - and silently
        overwrite - one Deployment.

        Stable is equally important: rollback runs `kubectl rollout undo
        deployment/<this name>`, so it must not change between deploys.
        """
        slug = re.sub(r"[^a-z0-9-]", "-", project.name.lower())
        slug = re.sub(r"-{2,}", "-", slug).strip("-")[:40].strip("-")
        return f"{slugify(project.name)}-{project.id}"

    def build(self, project, image: str) -> list[dict]:
        name = self.name(project)
        port = project.container_port

        container = {
            "name": "app",
            "image": image,
            # Never re-pull a cached tag - rollback relies on the previous
            # image already being present on the node.
            "imagePullPolicy": "IfNotPresent",
            "ports": [{"name": "http", "containerPort": port, "protocol": "TCP"}],
            "resources": {
                "requests": {"cpu": "100m", "memory": "128Mi"},
                "limits": {"cpu": "250m", "memory": "256Mi"},
            },
            # These two are safe for any image. `runAsNonRoot` is deliberately
            # absent: it fails for images whose Dockerfile has no USER, which
            # would turn a security nicety into a broken deployment.
            "securityContext": {
                "allowPrivilegeEscalation": False,
                "capabilities": {"drop": ["ALL"]},
            },
            "readinessProbe": {
                "httpGet": {"path": project.health_path, "port": port},
                "initialDelaySeconds": 5,
                "periodSeconds": 5,
                "failureThreshold": 6,
            },
        }

        if project.secret_refs:
            # References only. The Secret already exists in the tenant's
            # namespace; the platform never sees its contents.
            container["envFrom"] = [
                {"secretRef": {"name": s}} for s in project.secret_refs
            ]

        return [
            {
                "apiVersion": "v1",
                "kind": "Namespace",
                "metadata": {
                    "name": name,
                    "labels": {"app.kubernetes.io/managed-by": "self-healing-platform"},
                },
            },
            {
                "apiVersion": "v1",
                "kind": "ResourceQuota",
                "metadata": {"name": "quota", "namespace": name},
                "spec": {
                    "hard": {
                        "requests.cpu": "500m",
                        "requests.memory": "512Mi",
                        "limits.cpu": "1",
                        "limits.memory": "1Gi",
                        "pods": "4",
                    }
                },
            },
            {
                "apiVersion": "apps/v1",
                "kind": "Deployment",
                "metadata": {
                    "name": name,
                    "namespace": name,
                    "labels": {"app": name},
                },
                "spec": {
                    "replicas": project.replicas,
                    "selector": {"matchLabels": {"app": name}},
                    "template": {
                        "metadata": {"labels": {"app": name}},
                        "spec": {"containers": [container]},
                    },
                },
            },
            {
                "apiVersion": "v1",
                "kind": "Service",
                "metadata": {"name": name, "namespace": name, "labels": {"app": name}},
                "spec": {
                    "selector": {"app": name},
                    "ports": [
                        {"name": "http", "protocol": "TCP", "port": port, "targetPort": port}
                    ],
                    "type": "NodePort",
                },
            },
        ]