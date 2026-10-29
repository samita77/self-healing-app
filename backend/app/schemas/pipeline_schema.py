from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class StageResult(BaseModel):
    stage: str
    success: bool
    status: Optional[str] = None
    duration_s: Optional[float] = None
    error: Optional[str] = None

class PipelineRunResponse(BaseModel):
    id: int
    project_id: int
    commit_sha: str
    branch: str
    status: str
    failed_stage: Optional[str] = None
    duration_seconds: Optional[float] = None
    stage_results: list[StageResult] = []
    started_at: Optional[datetime] = None
    finished_at: Optional[datetime] = None
    log_output: Optional[str] = None

    class Config:
        from_attributes = True
