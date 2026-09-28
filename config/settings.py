import os
from pathlib import Path
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings(BaseSettings):
    # Base
    PROJECT_NAME: str = "MHD Real Estate Tech - AI Valuation"
    VERSION: str = "2.0.0"
    DEBUG: bool = False
    
    # Database (PostgreSQL 16 + PostGIS)
    POSTGRES_HOST: str = os.getenv("POSTGRES_HOST", "localhost")
    POSTGRES_PORT: int = int(os.getenv("POSTGRES_PORT", 5432))
    POSTGRES_DB: str = os.getenv("POSTGRES_DB", "mhd_valuation")
    POSTGRES_USER: str = os.getenv("POSTGRES_USER", "postgres")
    POSTGRES_PASSWORD: str = os.getenv("POSTGRES_PASSWORD", "")
    
    @property
    def DATABASE_URL(self) -> str:
        return f"postgresql://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        
    @property
    def ASYNC_DATABASE_URL(self) -> str:
        return f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@{self.POSTGRES_HOST}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"

    # Redis Cache
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB: int = int(os.getenv("REDIS_DB", 0))

    # Dataset Paths & Hugging Face
    HUGGINGFACE_DATASET_ID: str = os.getenv("HUGGINGFACE_DATASET_ID", "tinixai/vietnam-real-estates")
    DATA_RAW_DIR: Path = BASE_DIR / "data" / "raw"
    DATA_PROCESSED_FILE: Path = BASE_DIR / "data" / "processed" / "data_mhd_clean.parquet"
    
    # Model & Valuation Rules
    MARKET_DISCOUNT_FACTOR: float = float(os.getenv("MARKET_DISCOUNT_FACTOR", 0.93))
    MODEL_PATH: Path = BASE_DIR / "models" / "mhd_smart_v2.cbm"
    
    # Design Tokens (Hex colors)
    MHD_ORANGE: str = "#EC4A00"
    ORANGE_DARK: str = "#BD3900"
    GRAPHITE: str = "#3F4547"
    STEEL_GRAY: str = "#767A7B"
    WARM_PAPER: str = "#F4F2EE"
    ORANGE_SOFT: str = "#FFF0E8"

    class Config:
        case_sensitive = True

settings = Settings()
