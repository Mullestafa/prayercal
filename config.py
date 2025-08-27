import os
from functools import lru_cache
from pydantic import BaseSettings

class Settings(BaseSettings):
    # API Configuration
    mistral_api_key: str = ""
    
    # Server Configuration
    host: str = "0.0.0.0"
    port: int = 8000
    debug: bool = False
    
    # File Upload Configuration
    max_file_size: int = 10 * 1024 * 1024  # 10MB
    allowed_extensions: list = [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tiff"]
    
    # Application Configuration
    app_name: str = "Prayer Times Parser"
    app_version: str = "1.0.0"
    
    class Config:
        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings():
    return Settings()

settings = get_settings()
