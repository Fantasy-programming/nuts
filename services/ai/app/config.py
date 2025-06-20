import logging
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    MODEL_PATH: str = "data/category_model.pkl"
    VECTORIZER_PATH: str = "data/category_vectorizer.pkl"
    FEEDBACK_FILE_PATH: str = "data/feedback.csv"
    LOG_LEVEL: str = "INFO"
    DEFAULT_RETIREMENT_WITHDRAWAL_RATE: float = 0.04

    # This allows loading from a .env file
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")


settings = Settings()

# Setup logging based on the config
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

logger.info(f"Settings loaded: LOG_LEVEL={settings.LOG_LEVEL}")
