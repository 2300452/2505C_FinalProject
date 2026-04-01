from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    upload_dir: str = "uploads"
    database_url: str = "sqlite+aiosqlite:///./parkinsons_app.db"
    max_upload_size_mb: int = 500

settings = Settings()
