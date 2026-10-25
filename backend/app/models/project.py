from sqlalchemy import JSON, Column, DateTime, ForeignKey, Integer, String
from sqlalchemy.sql import func
from app.core.database import Base


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    repo_url = Column(String, nullable=False)
    # Kept for compatibility with the create form, but Dockerservice.build_tag derives the tag from name, not from this. Do not rely on it.
    docker_image_name = Column(String, nullable=False)
    # --- deployment configuration -------------------------------------
    # These four are what make the manifest generic. Without them the platform can only deploy applications that happen to look like the first one it was tested against.

    container_port = Column(Integer, nullable=False, server_default="5000")
    health_path = Column(String, nullable=False, server_default="/")
    replicas = Column(Integer, nullable=False, server_default="2")

    # A project with no owner cannot answer "who may deploy this?" - ownership is required, not optional.
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    secret_refs = Column(JSON, nullable=True)
