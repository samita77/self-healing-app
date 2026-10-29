import json
from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db, SessionLocal
from app.models.pipeline import PipelineRun
from app.models.project import Project
from app.models.user import User
from app.pipeline.build_stage import BuildStage
from app.pipeline.pipeline_runner import PipelineRunner
from app.pipeline.push_stage import PushStage
from app.pipeline.states import PipelineState
from app.pipeline.test_stage import TestStage
from app.routes.auth import get_current_user
from app.services.docker_service import DockerService
from app.services.git_service import GitService
from app.schemas.pipeline_schema import PipelineRunResponse
from app.pipeline.deploy_stage import DeployStage
from app.pipeline.verify_stage import VerifyStage
from app.models.deployment import Deployment

router = APIRouter(prefix="/pipelines", tags=["pipelines"])


def _owned_project(project_id: int, current_user: User, db: Session) -> Project:
    """Loads a project only if the caller owns it.

    Returns 404 rather than 403 for a project owned by someone else: a
    403 would confirm the project exists, which leaks information.
    """
    project = (
        db.query(Project)
        .filter(Project.id == project_id, Project.owner_id == current_user.id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _execute_pipeline(run_id: int, project_id: int):
    from app.core.database import SessionLocal
    db = SessionLocal()
    try:
        run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
        project = db.query(Project).filter(Project.id == project_id).first()
        if not run or not project: return
        def emit(text: str):
            live = SessionLocal()
            try:
                item = live.query(PipelineRun).filter(PipelineRun.id == run_id).first()
                if item:
                    item.log_output = ((item.log_output or "") + text)[-200_000:]
                    live.commit()
            finally: live.close()
        try:
            emit("Preparing repository…\n")
            git = GitService(); head = git.clone(project.repo_url, project_id)
            run.commit_sha = head["commit_sha"]; run.branch = head["branch"]; db.commit()
            docker = DockerService(); image = docker.build_tag(project.name, head["commit_sha"])
            context = {"project": project, "repo_path": str(git.project_path(project_id)), "docker_image_name": image, "commit_sha": head["commit_sha"], "commit_date": head["committed_at"].isoformat(), "log": lambda text: emit(str(text) + "\n")}
            stages = [BuildStage(docker), TestStage(), PushStage(docker), DeployStage(), VerifyStage()]
            def stage_start(state):
                update = SessionLocal()
                try:
                    active = update.query(PipelineRun).filter(PipelineRun.id == run_id).first()
                    if active: active.status = state.value; update.commit()
                finally: update.close()
                emit(f"\n== {state.value.upper()} ==\n")
            result = PipelineRunner(stages).run(context, on_stage_start=stage_start)
            run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
            run.status = result["status"]; run.failed_stage = next((r["stage"] for r in result["results"] if not r["success"]), None)
            run.stage_results = json.dumps(result["results"]); run.duration_seconds = result["duration_s"]; run.finished_at = datetime.now(timezone.utc)
            db.commit()
            for stage_result in result["results"]:
                emit(f"[{stage_result['stage']}] {'SUCCESS' if stage_result['success'] else 'FAILED'}{(': ' + str(stage_result.get('error'))) if stage_result.get('error') else ''}\n")
            deployment = None
            if context.get("deployed_image"):
                deployment = Deployment(project_id=project.id, version=head["commit_sha"][:7], namespace=context.get("namespace"), deployment_name=context.get("deployment_name"), node_port=context.get("node_port"), status="success" if result["status"] == PipelineState.SUCCESS.value else "failed")
                db.add(deployment)
            db.commit(); emit(f"\nPipeline {run.status.upper()}\n")
        except Exception as exc:
            run = db.query(PipelineRun).filter(PipelineRun.id == run_id).first()
            if run:
                run.status = PipelineState.FAILED.value; run.failed_stage = "Setup"; run.finished_at = datetime.now(timezone.utc); run.stage_results = json.dumps([{"stage":"Setup","success":False,"error":str(exc)[:500]}]); db.commit()
            emit(f"\nFAILED: {exc}\n")
    finally: db.close()


@router.post("/run/{project_id}", status_code=202)
def run_pipeline(project_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    _owned_project(project_id, current_user, db)
    run = PipelineRun(project_id=project_id, commit_sha="pending", branch="pending", status=PipelineState.RUNNING.value, log_output="Pipeline queued…\n", logs_expires_at=datetime.now(timezone.utc)+timedelta(days=30))
    db.add(run); db.commit(); db.refresh(run)
    background_tasks.add_task(_execute_pipeline, run.id, project_id)
    return {"pipeline_run_id": run.id, "status": run.status}


@router.get("/runs/{run_id}/events")
def pipeline_events(run_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    from fastapi.responses import StreamingResponse
    import asyncio
    query = db.query(PipelineRun).join(Project).filter(PipelineRun.id == run_id)
    if current_user.role != "admin": query = query.filter(Project.owner_id == current_user.id)
    run = query.first()
    if not run: raise HTTPException(status_code=404, detail="Pipeline run not found")
    db.close()
    async def stream():
        offset = 0
        while True:
            session = SessionLocal()
            try:
                item = session.query(PipelineRun).filter(PipelineRun.id == run_id).first()
                if not item: break
                if item.logs_expires_at and item.logs_expires_at <= datetime.now(timezone.utc):
                    item.log_output = None
                    session.commit()
                output = item.log_output or ""
                if len(output) > offset:
                    chunk = output[offset:]; offset = len(output)
                    yield "data: " + json.dumps({"chunk":chunk,"status":item.status,"terminal":item.finished_at is not None}) + "\n\n"
                if item.finished_at is not None: break
            finally: session.close()
            await asyncio.sleep(0.5)
    return StreamingResponse(stream(), media_type="text/event-stream", headers={"Cache-Control":"no-cache","X-Accel-Buffering":"no"})

@router.get("/runs/{project_id}", response_model=list[PipelineRunResponse])
def list_pipeline_runs(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    _owned_project(project_id, current_user, db)

    now = datetime.now(timezone.utc)
    db.query(PipelineRun).filter(PipelineRun.project_id == project_id, PipelineRun.logs_expires_at < now).update({PipelineRun.log_output: None}, synchronize_session=False)
    db.commit()
    runs = (
        db.query(PipelineRun)
        .filter(PipelineRun.project_id == project_id)
        .order_by(PipelineRun.id.desc())
        .all()
    )

    results = []
    for r in runs:
        stages = []
        if r.stage_results:
            try:
                stages = json.loads(r.stage_results)
            except json.JSONDecodeError:
                stages = []
        results.append(
            PipelineRunResponse(
                id=r.id,
                project_id=r.project_id,
                commit_sha=r.commit_sha,
                branch=r.branch,
                status=r.status,
                failed_stage=r.failed_stage,
                duration_seconds=r.duration_seconds,
                stage_results=stages,
                started_at=r.started_at,
                finished_at=r.finished_at,
                log_output=r.log_output if r.logs_expires_at is None or r.logs_expires_at > now else None,
            )
        )
    return results
