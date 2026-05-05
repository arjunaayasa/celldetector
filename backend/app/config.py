from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_DIR = Path(__file__).resolve().parents[1]
UPLOAD_DIR = BACKEND_DIR / "uploads"
RESULTS_DIR = BACKEND_DIR / "results"


class Settings(BaseSettings):
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "qwen2.5vl:7b"
    use_gpu: bool = False
    backend_base_url: str = "http://localhost:8000"
    database_url: str = f"sqlite:///{BACKEND_DIR / 'blood_cell_marker.db'}"
    jwt_secret_key: str = "change-this-local-development-secret"
    jwt_algorithm: str = "HS256"
    jwt_expire_hours: int = 24
    admin_email: str = "admin@bloodcell.local"
    admin_password: str = "admin12345"
    admin_name: str = "Administrator"

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )


settings = Settings()
