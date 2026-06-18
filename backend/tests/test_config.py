import pytest
from pydantic import ValidationError

from config import Settings

_REQUIRED = {
    "supabase_url": "https://example.supabase.co",
    "supabase_service_key": "service-key",
    "anthropic_api_key": "api-key",
}


def _make(**overrides) -> Settings:
    return Settings(**{**_REQUIRED, **overrides}, _env_file=None)


def test_loads_required_fields():
    s = _make()
    assert str(s.supabase_url).rstrip("/") == "https://example.supabase.co"
    assert s.supabase_service_key == "service-key"
    assert s.anthropic_api_key == "api-key"


def test_defaults():
    s = _make()
    assert s.log_level == "INFO"
    assert s.log_format == ""
    assert s.allowed_origins == "http://127.0.0.1:5173"


def test_optional_fields_can_be_overridden():
    s = _make(
        log_level="DEBUG", log_format="json", allowed_origins="https://app.example.com"
    )
    assert s.log_level == "DEBUG"
    assert s.log_format == "json"
    assert s.allowed_origins == "https://app.example.com"


def test_invalid_supabase_url_raises():
    with pytest.raises(ValidationError):
        _make(supabase_url="not-a-url")


def test_missing_supabase_url_raises(monkeypatch):
    monkeypatch.delenv("SUPABASE_URL", raising=False)
    with pytest.raises(ValidationError):
        Settings(supabase_service_key="key", anthropic_api_key="key", _env_file=None)


def test_missing_supabase_service_key_raises(monkeypatch):
    monkeypatch.delenv("SUPABASE_SERVICE_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(
            supabase_url="https://example.supabase.co",
            anthropic_api_key="key",
            _env_file=None,
        )


def test_missing_anthropic_api_key_raises(monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    with pytest.raises(ValidationError):
        Settings(
            supabase_url="https://example.supabase.co",
            supabase_service_key="key",
            _env_file=None,
        )


def test_loads_from_env_vars(monkeypatch):
    monkeypatch.setenv("SUPABASE_URL", "https://env.supabase.co")
    monkeypatch.setenv("SUPABASE_SERVICE_KEY", "env-service-key")
    monkeypatch.setenv("ANTHROPIC_API_KEY", "env-api-key")
    s = Settings(_env_file=None)
    assert str(s.supabase_url).rstrip("/") == "https://env.supabase.co"
    assert s.supabase_service_key == "env-service-key"
    assert s.anthropic_api_key == "env-api-key"
