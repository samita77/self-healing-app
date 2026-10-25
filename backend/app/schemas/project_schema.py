from pydantic import BaseModel
from datetime import datetime


class ProjectCreate(BaseModel):
    name: str
    repo_url: str
    docker_image_name: str
    container_port: int = 5000
    health_path: str = "/"
    replicas: int = 2
    secret_refs: list[str] | None = None


class ProjectResponse(BaseModel):
    id: int
    name: str
    repo_url: str
    docker_image_name: str
    owner_id: int
    created_at: datetime
    container_port: int
    health_path: str
    replicas: int
    secret_refs: list[str] | None = None

    class Config:
        from_attributes = True
