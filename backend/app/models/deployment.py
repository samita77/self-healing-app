from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    version = Column(String, nullable=False)
    status = Column(String, nullable=False) # pending, success, failed
    health_score = Column(Float, nullable=True)
    deployed_at = Column(DateTime(timezone=True), server_default=func.now())