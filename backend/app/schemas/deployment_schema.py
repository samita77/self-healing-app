from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class DeploymentCreate(BaseModel):
    project_id: int
    version: str
    status: str

class DeploymentResponse(BaseModel):
    id: int
    project_id: int
    version: str
    status: str
    namespace: Optional[str] = None
    deployment_name: Optional[str] = None
    health_score: Optional[float] = None
    deployed_at: datetime

    class Config:
        from_attributes = True
