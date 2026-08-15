from functools import lru_cache
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from the environment."""

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = Field(alias="DATABASE_URL")
    user_timezone: str = Field(default="Asia/Kathmandu", alias="USER_TIMEZONE")

    @property
    def async_database_url(self) -> str:
        """Return a SQLAlchemy async PostgreSQL URL compatible with asyncpg."""
        return normalize_async_database_url(self.database_url)

    @property
    def async_connect_args(self) -> dict[str, object]:
        """Return asyncpg connect args derived from the source URL."""
        return async_connect_args_for_url(self.database_url)


def normalize_async_database_url(url: str) -> str:
    """Convert common PostgreSQL URLs into an asyncpg-compatible form."""
    if url.startswith("postgres://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgres://")
    elif url.startswith("postgresql://"):
        url = "postgresql+asyncpg://" + url.removeprefix("postgresql://")
    elif not url.startswith("postgresql+asyncpg://"):
        return url

    parts = urlsplit(url)
    query_items = []
    for key, value in parse_qsl(parts.query, keep_blank_values=True):
        # asyncpg rejects libpq-only options such as sslmode.
        if key.lower() in {"sslmode", "channel_binding", "sslrootcert"}:
            continue
        query_items.append((key, value))

    return urlunsplit(
        (
            parts.scheme,
            parts.netloc,
            parts.path,
            urlencode(query_items),
            parts.fragment,
        )
    )


def async_connect_args_for_url(url: str) -> dict[str, object]:
    """Derive asyncpg connect args without exposing the URL."""
    parts = urlsplit(url)
    query = {key.lower(): value for key, value in parse_qsl(parts.query)}
    sslmode = query.get("sslmode", "").lower()
    if sslmode in {"require", "verify-ca", "verify-full", "prefer", "true", "1"}:
        return {"ssl": True}
    if "neon.tech" in parts.hostname.lower() if parts.hostname else False:
        return {"ssl": True}
    return {}


@lru_cache
def get_settings() -> Settings:
    return Settings()
