from pathlib import Path

from pydantic_settings import BaseSettings

BACKEND_DIR = Path(__file__).resolve().parent.parent


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql+asyncpg://postgres:postgres@localhost:5432/customer_support"
    REDIS_URL: str = "redis://localhost:6379"
    JWT_SECRET: str = "change-me"
    JWT_ACCESS_EXPIRY_MINUTES: int = 15
    JWT_REFRESH_EXPIRY_DAYS: int = 7
    ENCRYPTION_KEY: str = "00" * 16
    CORS_ORIGINS: list[str] = ["http://localhost:3000", "http://localhost:5173"]
    SMTP_HOST: str = "localhost"
    SMTP_PORT: int = 1025
    UPLOAD_DIR: str = str(BACKEND_DIR / "uploads")

    model_config = {"env_file": ".env"}


settings = Settings()
