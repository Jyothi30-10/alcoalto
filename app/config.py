import os

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./alcoalto.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "*").split(",")
DEVICE_API_KEY = os.getenv("DEVICE_API_KEY", "alcoalto-esp32-secret-key")
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")
