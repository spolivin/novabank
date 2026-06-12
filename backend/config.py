from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    supabase_url: AnyHttpUrl
    supabase_service_key: str
    anthropic_api_key: str
    log_level: str = "INFO"
    log_format: str = ""
    allowed_origins: str = "http://127.0.0.1:5173"


settings = Settings()
