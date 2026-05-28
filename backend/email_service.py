from fastapi_mail import FastMail, MessageSchema, MessageType
from email_config import conf, MAIL_SUPPRESS_SEND, MAIL_DEBUG, normalize_env_value
import os
import requests
import traceback


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

        print(f"Sending OTP email to {email} via {conf.MAIL_SERVER}:{conf.MAIL_PORT} from {conf.MAIL_FROM}")
        fm = FastMail(conf)

        if MAIL_SUPPRESS_SEND or MAIL_DEBUG:
          print("MAIL_SUPPRESS_SEND or MAIL_DEBUG enabled; skipping SMTP send in development mode.")
          return

        await fm.send_message(message)
        print("OTP Email sent successfully")

    except Exception as e:
        print("Error sending OTP email:", e)
        traceback.print_exc()

        if not conf.MAIL_SERVER or not conf.MAIL_USERNAME or not conf.MAIL_PASSWORD:
          print("Email configuration is incomplete. Skipping SMTP send and continuing in development mode.")
          return

        placeholder_values = [
            "your_nmims_email@nmims.edu",
            "your.actual.email@gmail.com",
            "your_16_char_app_password_no_spaces",
            "your_outlook_password"
        ]

        if conf.MAIL_USERNAME in placeholder_values or conf.MAIL_PASSWORD in placeholder_values:
          print("Detected placeholder email credentials. Skipping SMTP send and continuing in development mode.")
          return

        # If SMTP failed but SendGrid API key is provided, attempt API fallback
        sendgrid_key = os.getenv("SENDGRID_API_KEY")

        if sendgrid_key:
          try:
            print("Attempting SendGrid fallback for OTP email")
            sg_res = send_via_sendgrid(sendgrid_key, email,
                           subject="NMIMS eCanteen - OTP Verification",
                           plain_text=f"Hello,\n\nYour OTP is: {otp}\n\nThis OTP will expire in 5 minutes.\n\nRegards,\nNMIMS eCanteen\n")
            if sg_res:
              print("OTP Email sent successfully via SendGrid fallback")
              return
            else:
              print("SendGrid fallback failed")
          except Exception as sge:
            print("SendGrid fallback error:", sge)
            traceback.print_exc()

        # If we're in debug/dev or placeholders detected, don't raise to avoid blocking development
        if MAIL_SUPPRESS_SEND or MAIL_DEBUG or "Authentication unsuccessful" in str(e) or "535" in str(e):
          print("SMTP auth failed or debug mode enabled. Continuing without sending email in development mode.")
          return

        raise


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
        traceback.print_exc()


def _send_with_sendgrid_fallback(email: str, subject: str, plain_text: str, html: str = None) -> bool:
    sendgrid_key = os.getenv("SENDGRID_API_KEY")
    if not sendgrid_key:
        return False

    print(f"Attempting SendGrid fallback for {subject}")
    return send_via_sendgrid(sendgrid_key, email, subject=subject, plain_text=plain_text, html=html)


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
        return True

    except Exception as e:
        print("Error sending welcome email:", e)
        traceback.print_exc()

        if _send_with_sendgrid_fallback(email, "Welcome to NMIMS eCanteen! 🎉",
                                        plain_text=f"Hello {name},\n\nWelcome to NMIMS eCanteen! Your account has been created as a {role}.\n\nEnjoy our services.\n\nRegards,\nNMIMS eCanteen"):
            print("Welcome email sent successfully via SendGrid fallback")
            return True

        if MAIL_SUPPRESS_SEND or MAIL_DEBUG or "Authentication unsuccessful" in str(e) or "535" in str(e):
            print("SMTP auth failed or debug mode enabled. Continuing without sending email in development mode.")
            return False

        raise



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
        traceback.print_exc()

        if _send_with_sendgrid_fallback(email, "Password Reset Successful - NMIMS eCanteen 🔐",
                                        plain_text=f"Hi {name},\n\nYour password has been successfully reset. If you did not request this, please contact admin.\n\nRegards,\nNMIMS eCanteen"):
            print("Password reset email sent successfully via SendGrid fallback")
            return

        if MAIL_SUPPRESS_SEND or MAIL_DEBUG or "Authentication unsuccessful" in str(e) or "535" in str(e):
            print("SMTP auth failed or debug mode enabled. Continuing without sending email in development mode.")
            return

        raise

# ----------------------
# SendGrid fallback helper
# ----------------------
def send_via_sendgrid(api_key: str, to_email: str, subject: str, plain_text: str, html: str = None) -> bool:
    """Send a simple email via SendGrid Web API v3. Returns True on success."""
    url = "https://api.sendgrid.com/v3/mail/send"
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }

    content = [{"type": "text/plain", "value": plain_text}]
    if html:
        content.append({"type": "text/html", "value": html})

    sendgrid_from_email = normalize_env_value(os.getenv("SENDGRID_FROM_EMAIL")) or conf.MAIL_FROM
    sendgrid_from_name = normalize_env_value(os.getenv("SENDGRID_FROM_NAME")) or "NMIMS eCanteen"

    payload = {
        "personalizations": [{"to": [{"email": to_email}]}],
        "from": {"email": sendgrid_from_email or "no-reply@ecanteen.nmims.in", "name": sendgrid_from_name},
        "subject": subject,
        "content": content
    }

    if not sendgrid_from_email:
        print("WARNING: SendGrid fallback has no verified sender address configured. Set SENDGRID_FROM_EMAIL to a SendGrid verified sender.")

    resp = requests.post(url, headers=headers, json=payload, timeout=15)
    try:
        resp.raise_for_status()
        return True
    except Exception:
        print("SendGrid API error:", resp.status_code, resp.text)
        return False