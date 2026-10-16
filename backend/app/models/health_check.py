from sqlalchemy import JSON, Column, Integer, Float, Boolean, DateTime, ForeignKey, String
from sqlalchemy.sql import func
from app.core.database import Base

class HealthCheck(Base):
    __tablename__ = "health_checks"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), nullable=False)
    available = Column(Boolean, nullable=False)
    response_time_ms = Column(Float, nullable=True)
    error = Column(String, nullable=True)
    health_score = Column(Float, nullable=False)
    status = Column(String, nullable=False) # SUCCESSFUL, WARNING, FAILED
    components = Column(JSON, nullable=True)
    checked_at = Column(DateTime(timezone=True), server_default=func.now())
