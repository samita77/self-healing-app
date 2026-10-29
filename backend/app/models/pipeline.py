from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.sql import func
from app.core.database import Base

class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    commit_sha = Column(String, nullable=False)
    branch = Column(String, nullable=False, default="main")
    status = Column(String, nullable=False) # pending, running, success, failed
    failed_stage = Column(String, nullable=True)
    stage_results = Column(Text, nullable=True)
    duration_seconds = Column(Float, nullable=True)
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
    log_output = Column(Text, nullable=True)
    logs_expires_at = Column(DateTime(timezone=True), nullable=True)
