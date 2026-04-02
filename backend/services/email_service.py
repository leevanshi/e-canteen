import smtplib
import os
import logging
from email.mime.text import MIMEText
from dotenv import load_dotenv

load_dotenv()

MAIL_USERNAME = os.getenv("MAIL_USERNAME")
MAIL_PASSWORD = os.getenv("MAIL_PASSWORD")
MAIL_FROM = os.getenv("MAIL_FROM")
MAIL_SERVER = os.getenv("MAIL_SERVER")
MAIL_PORT = int(os.getenv("MAIL_PORT", 587))

logger = logging.getLogger(__name__)


def send_email(to_email: str, subject: str, message: str):

    msg = MIMEText(message, "html")
    msg["Subject"] = subject
    msg["From"] = MAIL_FROM
    msg["To"] = to_email

    try:
        server = smtplib.SMTP(MAIL_SERVER, MAIL_PORT)
        server.starttls()
        server.login(MAIL_USERNAME, MAIL_PASSWORD)

        server.sendmail(MAIL_FROM, to_email, msg.as_string())
        server.quit()

        logger.info(f"Email sent to {to_email}")

    except Exception as e:
        logger.error(f"Email failed: {e}")
        raise


async def send_otp_email(email: str, otp: str):

    subject = "NMIMS E-Canteen OTP Verification"

    body = f"""
    <h2>NMIMS E-Canteen</h2>
    <p>Your OTP is:</p>
    <h1 style="letter-spacing:4px">{otp}</h1>
    <p>This OTP will expire in <b>5 minutes</b>.</p>
    """

    send_email(email, subject, body)