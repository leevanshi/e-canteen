from fastapi_mail import ConnectionConfig
from pathlib import Path
import os
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")


def normalize_env_value(value: str | None) -> str | None:
    if value is None:
        return None
    value = value.strip()
    if value.startswith("<") and value.endswith(">"):
        value = value[1:-1].strip()
    return value


MAIL_STARTTLS = os.getenv("MAIL_STARTTLS", "True").lower() in ("1", "true", "yes")
MAIL_SSL_TLS = os.getenv("MAIL_SSL_TLS", "False").lower() in ("1", "true", "yes")
MAIL_SUPPRESS_SEND = os.getenv("MAIL_SUPPRESS_SEND", "False").lower() in ("1", "true", "yes")
MAIL_DEBUG = os.getenv("MAIL_DEBUG", "False").lower() in ("1", "true", "yes")

# Ensure the environment variables that pydantic expects as integers are normalized
os.environ["MAIL_SUPPRESS_SEND"] = "1" if MAIL_SUPPRESS_SEND else "0"
os.environ["MAIL_DEBUG"] = "1" if MAIL_DEBUG else "0"

conf = ConnectionConfig(
    MAIL_USERNAME=normalize_env_value(os.getenv("MAIL_USERNAME")),
    MAIL_PASSWORD=normalize_env_value(os.getenv("MAIL_PASSWORD")),
    MAIL_FROM=normalize_env_value(os.getenv("MAIL_FROM")) or normalize_env_value(os.getenv("MAIL_USERNAME")),
    MAIL_PORT=int(os.getenv("MAIL_PORT", 587)),
    MAIL_SERVER=normalize_env_value(os.getenv("MAIL_SERVER")),
    MAIL_STARTTLS=MAIL_STARTTLS,
    MAIL_SSL_TLS=MAIL_SSL_TLS,
    USE_CREDENTIALS=True
)
