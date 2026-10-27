from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from app.core.database import Base

class Deployment(Base):
    __tablename__ = "deployments"

    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    version = Column(String, nullable=False)
    status = Column(String, nullable=False) # pending, success, failed
    # The Kubernetes identity this row refers to. Nullable because the three deployments created before the pipeline deployed anything have none.
    namespace = Column(String, nullable=True)
    deployment_name = Column(String, nullable=True)
    # NodePort assigned by k8s for the Service; used to build the health check URL.
    node_port = Column(Integer, nullable=True)
    health_score = Column(Float, nullable=True)
    deployed_at = Column(DateTime(timezone=True), server_default=func.now())