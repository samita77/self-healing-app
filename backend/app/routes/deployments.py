from fastapi import APIRouter
from app.deployment.k8s_client import K8sClient
from app.core.config import settings

router = APIRouter(prefix="/deployment", tags=["deployment"])

@router.post("/apply-hpa")
def apply_hpa():
    manifest_path = f"{settings.manifest_dir}/backend-hpa.yaml"
    success = K8sClient().apply_manifest(manifest_path)
    return {"manifest_path": manifest_path, "hpa_applied": success}
    