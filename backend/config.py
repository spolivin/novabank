from pydantic import AnyHttpUrl
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from the environment (and a local ``.env``).

    Attributes:
        supabase_url: Base URL of the Supabase project.
        supabase_service_key: Service-role key used for admin operations.
        anthropic_api_key: API key for the Claude API.
        log_level: Root log level for application loggers.
        log_format: ``"json"`` for structured logs, anything else for text.
        third_party_log_level: Log level applied to noisy third-party loggers.
        allowed_origins: Comma-separated list of CORS-allowed origins.
        trusted_proxy_count: Number of trusted reverse proxies in front of the
            app. ``0`` (the default) ignores ``X-Forwarded-For`` entirely and
            keys rate limits on the direct peer, which a client cannot spoof.
            Set this to the real hop count in production (e.g. ``1`` behind a
            single reverse proxy) so the client IP is read from a position the
            trusted infrastructure controls.
        health_check_token: Shared secret required in the ``X-Health-Token``
            header to reach ``GET /health/db``. Empty (the default) leaves the
            endpoint open; set it to gate the unauthenticated DB probe.
    """

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    supabase_url: AnyHttpUrl
    supabase_service_key: str
    anthropic_api_key: str
    log_level: str = "INFO"
    log_format: str = ""
    third_party_log_level: str = "WARNING"
    allowed_origins: str = "http://127.0.0.1:5173"
    trusted_proxy_count: int = 0
    health_check_token: str = ""


settings = Settings()
