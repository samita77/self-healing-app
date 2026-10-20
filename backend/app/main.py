from fastapi import FastAPI
from app.routes import projects
from app.routes import pipelines
from app.routes import auth
from app.deployment.k8s_client import K8sClient
from sqlalchemy import text
from app.routes import health
from app.routes import monitor
from app.routes import deployment as deployment_routes
from app.routes import deployments
from app.routes import users
from app.models import project, deployment as deployment_model, health_check, rollback_event
from fastapi.middleware.cors import CORSMiddleware


#temporary for now:
from app.core.database import Base, engine



app = FastAPI(title="Self-Healing DevOps Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"status": "running"}

@app.get("/db-check")
def db_check():
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        return {"db_connected": True, "result": result.scalar()}

@app.post("/test-deploy")
def test_deploy():
    client = K8sClient()
    success = client.apply_manifest("../k8s-manifests/backend.yaml")
    return {"deployed": success}

app.include_router(projects.router)
app.include_router(pipelines.router)
app.include_router(auth.router)
app.include_router(health.router)
app.include_router(monitor.router)
app.include_router(deployment_routes.router)
app.include_router(deployments.router)
app.include_router(users.router)
