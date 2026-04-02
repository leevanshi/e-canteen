from fastapi_mail import FastMail, MessageSchema
from email_config import conf


# ✅ OTP EMAIL FUNCTION
async def send_otp_email(email: str, otp: str):
    try:
        message = MessageSchema(
            subject="NMIMS eCanteen - OTP Verification",
            recipients=[email],
            body=f"""
Hello,

Your OTP is: {otp}

This OTP will expire in 5 minutes.

Do not share this with anyone.

Regards,
NMIMS eCanteen
""",
            subtype="plain"
        )

        fm = FastMail(conf)
        await fm.send_message(message)

        print("OTP Email sent successfully")

    except Exception as e:
        print("Error sending OTP email:", e)


# ✅ ORDER EMAIL FUNCTION (SEPARATE + CORRECT)
async def send_order_email(email: str, order_details: str):
    try:
        message = MessageSchema(
            subject="NMIMS eCanteen - Order Confirmation",
            recipients=[email],
            body=f"""
Hello,

Your order has been placed successfully.

Order Details:
{order_details}

Thank you for using NMIMS Chandigarh eCanteen.

Regards,
eCanteen Team
""",
            subtype="plain"
        )

        fm = FastMail(conf)
        await fm.send_message(message)

        print("Order Email sent successfully")

    except Exception as e:
        print("Error sending order email:", e)