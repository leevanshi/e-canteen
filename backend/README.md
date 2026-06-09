# E-Canteen

## Backend Email Configuration

This backend uses a centralized SMTP email service in `backend/services/email_service.py`.
Configure one of the supported SMTP providers via environment variables in `backend/.env` or your deployment environment.

Required variables:
- `SMTP_HOST`: SMTP server hostname
- `SMTP_PORT`: SMTP server port
- `SMTP_USER`: SMTP username / login
- `SMTP_PASSWORD`: SMTP password or app password
- `EMAIL_FROM`: sender address used in outgoing emails

Optional variables:
- `SMTP_STARTTLS`: `True` or `False` (defaults to `True`)
- `SMTP_USE_SSL`: `True` or `False` (defaults to `False`)
- `SMTP_DEBUG`: `True` or `False` (extra logging; may echo OTP in API response for testing — does **not** block delivery)
- `SMTP_SUPPRESS_SEND`: `True` or `False` (skip actual send — use only for local dev without a mail provider; must be `False` in production)
- `CORS_ALLOWED_ORIGINS`: comma-separated frontend URLs
- `ADMIN_NOTIFICATION_EMAILS`: comma-separated admins to notify for order events

Legacy `MAIL_*` values are still accepted for backward compatibility, but new deployments should use `SMTP_*` and `EMAIL_FROM`.

