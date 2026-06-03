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


SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "True").lower() in ("1", "true", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "False").lower() in ("1", "true", "yes")
SMTP_SUPPRESS_SEND = os.getenv("SMTP_SUPPRESS_SEND", "False").lower() in ("1", "true", "yes")
SMTP_DEBUG = os.getenv("SMTP_DEBUG", "False").lower() in ("1", "true", "yes")

# Ensure the environment variables that pydantic expects as integers are normalized
os.environ["SMTP_SUPPRESS_SEND"] = "1" if SMTP_SUPPRESS_SEND else "0"
os.environ["SMTP_DEBUG"] = "1" if SMTP_DEBUG else "0"

conf = ConnectionConfig(
    MAIL_USERNAME=normalize_env_value(os.getenv("SMTP_USER")) or normalize_env_value(os.getenv("MAIL_USERNAME")),
    MAIL_PASSWORD=normalize_env_value(os.getenv("SMTP_PASSWORD")) or normalize_env_value(os.getenv("MAIL_PASSWORD")),
    MAIL_FROM=normalize_env_value(os.getenv("EMAIL_FROM")) or normalize_env_value(os.getenv("MAIL_FROM")) or normalize_env_value(os.getenv("SMTP_USER")),
    MAIL_PORT=int(os.getenv("SMTP_PORT", os.getenv("MAIL_PORT", 587))),
    MAIL_SERVER=normalize_env_value(os.getenv("SMTP_HOST")) or normalize_env_value(os.getenv("MAIL_SERVER")),
    MAIL_STARTTLS=SMTP_STARTTLS,
    MAIL_SSL_TLS=SMTP_USE_SSL,
    USE_CREDENTIALS=True
)
