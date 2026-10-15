from pydantic import BaseModel
from datetime import datetime

class ProjectCreate(BaseModel):
    name: str
    repo_url: str
    docker_image_name: str

class ProjectResponse(BaseModel):
    id: int
    name: str
    repo_url: str
    docker_image_name: str
    created_at: datetime

    class Config:
        from_attributes = True