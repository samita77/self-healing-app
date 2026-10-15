from fastapi import APIRouter
from app.deployment.k8s_client import K8sClient
import os

router = APIRouter(prefix="/deployment", tags=["deployment"])

@router.post("/apply-hpa")
def apply_hpa():
    client = K8sClient()
    # base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    # manifest_path = os.path.join(base_dir, "../k8s-manifests", "backend-hpa.yaml")
    manifest_path = "/home/samita/self-healing-platform/k8s-manifests/backend-hpa.yaml"
    success = client.apply_manifest(manifest_path)
    return {"hpa_applied": success}