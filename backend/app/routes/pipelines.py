import json
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.deployment.deployment_manager import DeploymentManager
from app.models.pipeline import PipelineRun
from app.models.project import Project
from app.pipeline.build_stage import BuildStage
from app.pipeline.pipeline_runner import PipelineRunner
from app.pipeline.push_stage import PushStage
from app.pipeline.test_stage import TestStage
from app.services.docker_service import DockerService
from app.services.git_service import GitService

router = APIRouter(prefix="/pipelines", tags=["pipelines"])

@router.post("/run/{project_id}")
def run_pipeline(project_id: int, db: Session = Depends(get_db)):
    project = db.query(Project).filter(Project.id == project_id).first()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    git = GitService()
    try:
        head = git.clone(project.repo_url, project_id)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    docker = DockerService()
    image = docker.build_tag(project.name, head["commit_sha"])

    run = PipelineRun(
        project_id=project_id,
        commit_sha=head["commit_sha"],
        branch=head["branch"],
        status="running"
    )
    db.add(run)
    db.commit()
    db.refresh(run)

    context = {
        "repo_path": str(git.project_path(project_id)),
        "docker_image_name": image,
        "commit_sha": head["commit_sha"],
        "commit_date": head["committed_at"].isoformat(),
    }

    stages = [BuildStage(docker), TestStage(), PushStage(docker)]
    result = PipelineRunner(stages).run(context)

    run.status = "success" if result["status"] == "success" else "failed"
    run.failed_stage = result.get("failed_at")
    run.stage_results = json.dumps(result["results"])
    run.finished_at = datetime.now(timezone.utc)
    db.commit()

    return{**result, "pipeline_run_id": run.id, "image": image}