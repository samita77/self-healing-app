from fastapi import APIRouter
from app.deployment.post_deploy_verifier import PostDeployVerifier

router = APIRouter(prefix="/health", tags=["health"])

@router.get("/check")
def check_app_health(url: str):
    verifier = PostDeployVerifier()
    probe, score_result = verifier.check_and_score(url)
    return {"raw_check": probe, "health_score":score_result}