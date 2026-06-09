import json
import os
import asyncio
import logging
import smtplib
import time
import urllib.request
import urllib.error
from email.message import EmailMessage
from pathlib import Path
from typing import List, Optional

from dotenv import load_dotenv

# #region agent log
_DEBUG_LOG = Path(__file__).resolve().parents[2] / "debug-3e7df7.log"
def _agent_log(location, message, data, hypothesis_id):
    try:
        payload = {"sessionId": "3e7df7", "timestamp": int(time.time() * 1000), "location": location, "message": message, "data": data, "hypothesisId": hypothesis_id}
        with open(_DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
# #endregion

load_dotenv()

logger = logging.getLogger(__name__)

RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_BASE_URL = "https://api.resend.com/emails"
USE_RESEND = bool(RESEND_API_KEY)

SMTP_HOST = os.getenv("SMTP_HOST") or os.getenv("MAIL_SERVER")
SMTP_PORT = int(os.getenv("SMTP_PORT", os.getenv("MAIL_PORT", 587) or 587))
SMTP_USER = os.getenv("SMTP_USER") or os.getenv("MAIL_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD") or os.getenv("MAIL_PASSWORD")
EMAIL_FROM = os.getenv("EMAIL_FROM") or os.getenv("MAIL_FROM") or ("onboarding@resend.dev" if USE_RESEND else SMTP_USER)

SMTP_STARTTLS = os.getenv("SMTP_STARTTLS", "True").lower() in ("1", "true", "yes")
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "False").lower() in ("1", "true", "yes")
SMTP_SUPPRESS_SEND = os.getenv("SMTP_SUPPRESS_SEND", "False").lower() in ("1", "true", "yes")
SMTP_DEBUG = os.getenv("SMTP_DEBUG", "False").lower() in ("1", "true", "yes")

ADMIN_NOTIFICATION_EMAILS = [
    email.strip()
    for email in (os.getenv("ADMIN_NOTIFICATION_EMAILS") or "").split(",")
    if email.strip()
]

SMTP_TIMEOUT = int(os.getenv("SMTP_TIMEOUT", 30))
SMTP_RETRY_COUNT = int(os.getenv("SMTP_RETRY_COUNT", 2))
SMTP_RETRY_DELAY = int(os.getenv("SMTP_RETRY_DELAY", 3))


def _build_message(
    subject: str,
    to_email: str,
    plain_text: str,
    html: Optional[str] = None,
    reply_to: Optional[str] = None,
) -> EmailMessage:

    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = EMAIL_FROM
    message["To"] = to_email

    if reply_to:
        message["Reply-To"] = reply_to

    message.set_content(plain_text)

    if html:
        message.add_alternative(html, subtype="html")

    return message


def _send_message(message: EmailMessage, recipients: List[str]) -> None:
    # #region agent log
    _agent_log("email_service.py:_send_message", "smtp_send_branch", {"suppress": SMTP_SUPPRESS_SEND, "debug": SMTP_DEBUG}, "H1")
    # #endregion
    if SMTP_SUPPRESS_SEND:
        logger.info(
            "SMTP suppressed delivery (SMTP_SUPPRESS_SEND=True; set to False in production)",
        )
        return
    if SMTP_DEBUG:
        logger.info("SMTP_DEBUG=True — delivery will proceed; OTP may be echoed in API response")

    if not SMTP_HOST or not SMTP_USER or not SMTP_PASSWORD or not EMAIL_FROM:
        raise RuntimeError(
            "SMTP environment variables are not configured. Set SMTP_HOST, SMTP_PORT, "
            "SMTP_USER, SMTP_PASSWORD, and EMAIL_FROM."
        )

    logger.info("SMTP sending email to %s via %s:%s", recipients, SMTP_HOST, SMTP_PORT)

    if SMTP_USE_SSL:
        client = smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT)
    else:
        client = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=SMTP_TIMEOUT)

    with client as server:
        if not SMTP_USE_SSL and SMTP_STARTTLS:
            server.starttls()
        server.login(SMTP_USER, SMTP_PASSWORD)
        server.send_message(message, from_addr=EMAIL_FROM, to_addrs=recipients)
        server.quit()

    logger.info("SMTP email delivered to %s", recipients)


def _send_via_resend(recipients: List[str], subject: str, plain_text: str, html: Optional[str] = None) -> None:
    # #region agent log
    _agent_log("email_service.py:_send_via_resend", "resend_send_branch", {"suppress": SMTP_SUPPRESS_SEND, "debug": SMTP_DEBUG, "use_resend": USE_RESEND}, "H1")
    # #endregion
    if SMTP_SUPPRESS_SEND:
        logger.info(
            "Resend suppressed delivery (SMTP_SUPPRESS_SEND=True; set to False in production)",
        )
        return
    if SMTP_DEBUG:
        logger.info("SMTP_DEBUG=True — Resend delivery will proceed")

    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is required to send email via Resend API.")

    payload = {
        "from": EMAIL_FROM,
        "to": recipients,
        "subject": subject,
        "text": plain_text,
    }
    if html:
        payload["html"] = html

    request_data = json.dumps(payload).encode("utf-8")
    request = urllib.request.Request(
        RESEND_BASE_URL,
        data=request_data,
        method="POST",
        headers={
            "Authorization": f"Bearer {RESEND_API_KEY}",
            "Content-Type": "application/json",
        },
    )

    try:
        with urllib.request.urlopen(request, timeout=SMTP_TIMEOUT) as response:
            status_code = response.getcode()
            if status_code not in (200, 201):
                raise RuntimeError(f"Resend API returned unexpected status: {status_code}")
    except urllib.error.HTTPError as exc:
        error_body = exc.read().decode("utf-8", errors="ignore")
        raise RuntimeError(f"Resend API HTTP error: {exc.code} {exc.reason} {error_body}")
    except urllib.error.URLError as exc:
        raise RuntimeError(f"Resend API connection error: {exc}")

    logger.info("Resend API email delivered to %s", recipients)


async def send_email(
    to_email: str,
    subject: str,
    plain_text: str,
    html: Optional[str] = None,
) -> bool:
    if USE_RESEND:
        last_exception = None
        for attempt in range(1, SMTP_RETRY_COUNT + 1):
            try:
                await asyncio.to_thread(_send_via_resend, [to_email], subject, plain_text, html)
                return True
            except Exception as exc:
                last_exception = exc
                logger.warning(
                    "Resend send attempt %s/%s failed for %s: %s",
                    attempt,
                    SMTP_RETRY_COUNT,
                    to_email,
                    exc,
                )
                if attempt < SMTP_RETRY_COUNT:
                    await asyncio.sleep(SMTP_RETRY_DELAY)

        logger.error("Resend send failed after %s attempts: %s", SMTP_RETRY_COUNT, last_exception)
        raise last_exception

    message = _build_message(subject, to_email, plain_text, html)

    last_exception = None
    for attempt in range(1, SMTP_RETRY_COUNT + 1):
        try:
            await asyncio.to_thread(_send_message, message, [to_email])
            return True
        except Exception as exc:
            last_exception = exc
            logger.warning(
                "SMTP send attempt %s/%s failed for %s: %s",
                attempt,
                SMTP_RETRY_COUNT,
                to_email,
                exc,
            )
            if attempt < SMTP_RETRY_COUNT:
                await asyncio.sleep(SMTP_RETRY_DELAY)

    logger.error("SMTP send failed after %s attempts: %s", SMTP_RETRY_COUNT, last_exception)
    raise last_exception


async def send_bulk_email(
    recipients: List[str],
    subject: str,
    plain_text: str,
    html: Optional[str] = None,
) -> bool:
    if not recipients:
        logger.info("No bulk email recipients configured; skipping.")
        return False

    if USE_RESEND:
        last_exception = None
        for attempt in range(1, SMTP_RETRY_COUNT + 1):
            try:
                await asyncio.to_thread(_send_via_resend, recipients, subject, plain_text, html)
                return True
            except Exception as exc:
                last_exception = exc
                logger.warning(
                    "Resend bulk send attempt %s/%s failed for %s: %s",
                    attempt,
                    SMTP_RETRY_COUNT,
                    recipients,
                    exc,
                )
                if attempt < SMTP_RETRY_COUNT:
                    await asyncio.sleep(SMTP_RETRY_DELAY)

        logger.error("Resend bulk send failed after %s attempts: %s", SMTP_RETRY_COUNT, last_exception)
        raise last_exception

    message = _build_message(subject, recipients[0], plain_text, html)
    if len(recipients) > 1:
        message["To"] = ", ".join(recipients)

    last_exception = None
    for attempt in range(1, SMTP_RETRY_COUNT + 1):
        try:
            await asyncio.to_thread(_send_message, message, recipients)
            return True
        except Exception as exc:
            last_exception = exc
            logger.warning(
                "SMTP bulk send attempt %s/%s failed for %s: %s",
                attempt,
                SMTP_RETRY_COUNT,
                recipients,
                exc,
            )
            if attempt < SMTP_RETRY_COUNT:
                await asyncio.sleep(SMTP_RETRY_DELAY)

    logger.error("SMTP bulk send failed after %s attempts: %s", SMTP_RETRY_COUNT, last_exception)
    raise last_exception


async def send_otp_email(email: str, otp: str) -> bool:
    subject = "eCanteen OTP Verification"
    plain_text = (
        f"Hello,\n\nYour OTP is: {otp}\n\n"
        "This OTP will expire in 5 minutes.\n\n"
        "Do not share this code with anyone.\n\n"
        "Regards,\neCanteen"
    )
    html = (
        f"<html><body>"
        f"<h2>eCanteen</h2>"
        f"<p>Your OTP is:</p>"
        f"<h1 style=\"letter-spacing:4px\">{otp}</h1>"
        f"<p>This OTP will expire in <strong>5 minutes</strong>.</p>"
        f"<p>Do not share this code with anyone.</p>"
        f"<p>Regards,<br/>eCanteen</p>"
        f"</body></html>"
    )
    return await send_email(email, subject, plain_text, html)


async def send_welcome_email(email: str, name: str, role: str) -> bool:
    subject = "Welcome to eCanteen!"
    plain_text = (
        f"Hello {name},\n\n"
        "Welcome to eCanteen. Your account has been successfully created.\n\n"
        f"Role: {role.capitalize()}\n\n"
        "We look forward to serving you fresh meals.\n\n"
        "Regards,\neCanteen"
    )
    html = (
        f"<html><body>"
        f"<div style=\"font-family:Arial,sans-serif;max-width:600px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:12px;\">"
        f"<h1 style=\"color:#f97316;\">Welcome to eCanteen!</h1>"
        f"<p>Hi {name},</p>"
        f"<p>Your account has been successfully created as a <strong>{role.capitalize()}</strong>.</p>"
        f"<p>You're now ready to place orders and enjoy dining through our app.</p>"
        f"<p>Regards,<br/>eCanteen Team</p>"
        f"</div></body></html>"
    )
    return await send_email(email, subject, plain_text, html)


async def send_password_reset_email(email: str, name: str) -> bool:
    subject = "Your eCanteen Password Has Been Reset"
    plain_text = (
        f"Hello {name},\n\n"
        "Your password was successfully reset. If you did not request this change, please contact support immediately.\n\n"
        "Regards,\neCanteen"
    )
    html = (
        f"<html><body>"
        f"<h2>Password Reset Successful</h2>"
        f"<p>Hi {name},</p>"
        f"<p>Your password was successfully reset.</p>"
        f"<p>If you did not request this change, please contact support immediately.</p>"
        f"<p>Regards,<br/>eCanteen</p>"
        f"</body></html>"
    )
    return await send_email(email, subject, plain_text, html)


async def send_order_email(email: str, order_details: str, order_id: Optional[str] = None) -> bool:
    subject = f"eCanteen Order Confirmation{f' - #{order_id}' if order_id else ''}"
    plain_text = (
        "Hello,\n\nThank you for your order. The details are below:\n\n"
        f"{order_details}\n\n"
        "We will notify you once your order is ready.\n\n"
        "Regards,\neCanteen"
    )
    html = (
        f"<html><body>"
        f"<h2>Order Confirmation{f' - #{order_id}' if order_id else ''}</h2>"
        f"<p>Thank you for your order. Here are the details:</p>"
        f"<pre style=\"font-family:inherit;white-space:pre-wrap;\">{order_details}</pre>"
        f"<p>We will notify you once your order is ready.</p>"
        f"<p>Regards,<br/>eCanteen</p>"
        f"</body></html>"
    )
    return await send_email(email, subject, plain_text, html)


async def send_order_status_update(email: str, order_id: str, status: str) -> bool:
    subject = f"Order Status Update - eCanteen #{order_id}"
    plain_text = (
        f"Hello,\n\nYour order #{order_id} status has been updated to: {status}.\n\n"
        "Please check the app for latest order details.\n\n"
        "Regards,\neCanteen"
    )
    html = (
        f"<html><body>"
        f"<h2>Order Status Updated</h2>"
        f"<p>Your order <strong>#{order_id}</strong> is now <strong>{status}</strong>.</p>"
        f"<p>Please check the app for the latest order details.</p>"
        f"<p>Regards,<br/>eCanteen</p>"
        f"</body></html>"
    )
    return await send_email(email, subject, plain_text, html)


async def send_admin_notification(subject: str, body: str, recipients: Optional[List[str]] = None) -> bool:
    recipients = recipients or ADMIN_NOTIFICATION_EMAILS
    if not recipients:
        logger.info("No admin notification recipients are configured; skipping email.")
        return False

    plain_text = body
    html = f"<html><body><pre style=\"font-family:inherit;white-space:pre-wrap;\">{body}</pre></body></html>"
    return await send_bulk_email(recipients, subject, plain_text, html)
