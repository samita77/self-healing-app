import json
from unittest.mock import patch

from app.deployment.k8s_client import K8sClient


def test_list_pods_uses_project_label_and_returns_container_names():
    payload = {"items": [{"metadata": {"name": "web-a"}, "status": {"phase": "Running"}, "spec": {"containers": [{"name": "app"}]}}]}
    with patch("app.deployment.k8s_client.subprocess.run") as run:
        run.return_value.returncode = 0
        run.return_value.stdout = json.dumps(payload)
        pods = K8sClient().list_pods("project-4", "web-4")
    assert pods == [{"name": "web-a", "phase": "Running", "containers": ["app"]}]
    assert run.call_args.args[0][0:6] == ["kubectl", "get", "pods", "-n", "project-4", "-l"]


def test_pod_logs_are_timestamped_and_line_bounded():
    with patch("app.deployment.k8s_client.subprocess.run") as run:
        run.return_value.returncode = 0
        run.return_value.stdout = "2026-10-29T00:00:00Z ready\n"
        output = K8sClient().pod_logs("project-4", "web-a", "app", 120)
    assert "ready" in output
    args = run.call_args.args[0]
    assert "--tail=120" in args and "--timestamps=true" in args


def test_pod_logs_raise_kubernetes_error():
    with patch("app.deployment.k8s_client.subprocess.run") as run:
        run.return_value.returncode = 1
        run.return_value.stderr = "pod not found"
        try:
            K8sClient().pod_logs("project-4", "missing", "app")
        except RuntimeError as exc:
            assert "pod not found" in str(exc)
        else:
            raise AssertionError("expected kubectl failure")
