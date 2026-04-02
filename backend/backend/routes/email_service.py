from fastapi_mail import FastMail, MessageSchema
from email_config import conf

async def send_otp_email(email: str, otp: str):

    message = MessageSchema(
        subject="NMIMS Verification OTP",
        recipients=[email],
        body=f"Your OTP is {otp}. It expires in 5 minutes.",
        subtype="plain"
    )

    fm = FastMail(conf)
    await fm.send_message(message)