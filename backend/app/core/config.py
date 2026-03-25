from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    APP_NAME: str = "AI Finance Ops"
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60

    DATABASE_URL: str
    REDIS_URL: str = "redis://localhost:6379/0"

    STRIPE_SECRET_KEY: str
    STRIPE_WEBHOOK_SECRET: str

    ANTHROPIC_API_KEY: str

    ENVIRONMENT: str = "development"

    class Config:
        env_file = ".env"

settings = Settings()
