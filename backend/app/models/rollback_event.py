from sqlalchemy import Boolean, Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class RollbackEvent(Base):
    __tablename__ = "rollback_events"

    id = Column(Integer, primary_key=True, index=True)
    deployment_id = Column(Integer, ForeignKey("deployments.id"), nullable=False)
    reason = Column(String, nullable=False)
    success = Column(Boolean, nullable=False)
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())