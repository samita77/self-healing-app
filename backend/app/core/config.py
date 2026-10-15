from pydantic_settings import BaseSettings, SettingsConfigDict
from pathlib import Path


PROJECT_ROOT = Path(__file__).resolve().parents[3]
K8S_MANIFEST_DIR = PROJECT_ROOT / "k8s-manifests"

class Settings(BaseSettings):
    supabase_db_url: str
    supabase_pooler_url: str
    supabase_project_ref: str
    supabase_region: str

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    manifest_dir: str = str(K8S_MANIFEST_DIR)

    @property
    def database_url(self) -> str:
        return self.supabase_pooler_url

settings = Settings()