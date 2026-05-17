from fastapi_mail import FastMail, MessageSchema, MessageType
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


# ✅ WELCOME EMAIL FUNCTION (sent on registration)
async def send_welcome_email(email: str, name: str, role: str):
    try:
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #fff8f1; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px;
                        padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f97316; font-size: 28px; margin: 0;">☕ NMIMS eCanteen</h1>
                <p style="color: #6b7280; margin-top: 6px;">Your campus food companion</p>
              </div>
              <h2 style="color: #1f2937;">Welcome, {name}! 🎉</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                Your account has been successfully created as a
                <strong style="color: #f97316;">{role.capitalize()}</strong>.
                You're now part of the NMIMS Chandigarh eCanteen family!
              </p>
              <div style="background: #fff7ed; border-left: 4px solid #f97316;
                          padding: 16px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  🔒 Keep your credentials safe. Never share your password with anyone.
                </p>
              </div>
              <p style="color: #4b5563; font-size: 15px;">
                You can now log in and start ordering from the canteen.
                Enjoy freshly prepared meals right at your fingertips!
              </p>
              <div style="text-align: center; margin-top: 32px;">
                <p style="color: #9ca3af; font-size: 13px;">— NMIMS Chandigarh eCanteen Team</p>
              </div>
            </div>
          </body>
        </html>
        """

        message = MessageSchema(
            subject="Welcome to NMIMS eCanteen! 🎉",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)

        print(f"Welcome email sent to {email}")

    except Exception as e:
        print("Error sending welcome email:", e)


# ✅ PASSWORD RESET CONFIRMATION EMAIL
async def send_password_reset_email(email: str, name: str):
    try:
        html_body = f"""
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #fff8f1; padding: 30px;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px;
                        padding: 40px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #f97316; font-size: 28px; margin: 0;">☕ NMIMS eCanteen</h1>
                <p style="color: #6b7280; margin-top: 6px;">Your campus food companion</p>
              </div>
              <h2 style="color: #1f2937;">Password Reset Successful 🔐</h2>
              <p style="color: #4b5563; font-size: 15px; line-height: 1.6;">
                Hi <strong>{name}</strong>,<br/><br/>
                Your password has been successfully reset. You can now log in
                with your new password.
              </p>
              <div style="background: #fef2f2; border-left: 4px solid #ef4444;
                          padding: 16px; border-radius: 6px; margin: 24px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  ⚠️ If you did NOT request this change, please contact the canteen admin immediately.
                </p>
              </div>
              <p style="color: #4b5563; font-size: 15px;">
                For your security, please avoid reusing old passwords and
                make sure your password is strong.
              </p>
              <div style="text-align: center; margin-top: 32px;">
                <p style="color: #9ca3af; font-size: 13px;">— NMIMS Chandigarh eCanteen Team</p>
              </div>
            </div>
          </body>
        </html>
        """

        message = MessageSchema(
            subject="Password Reset Successful - NMIMS eCanteen 🔐",
            recipients=[email],
            body=html_body,
            subtype=MessageType.html
        )

        fm = FastMail(conf)
        await fm.send_message(message)

        print(f"Password reset email sent to {email}")

    except Exception as e:
        print("Error sending password reset email:", e)