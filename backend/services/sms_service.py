from twilio.rest import Client
from config import settings


twilio_client = Client(
    settings.TWILIO_ACCOUNT_SID,
    settings.TWILIO_AUTH_TOKEN
)


async def send_order_confirmation_sms(
    phone: str,
    order_id: str,
    amount: float,
    pickup_time: str,
):
    """
    Sends order confirmation SMS to user
    """

    message = (
        f"🍽️ E-Canteen Order Confirmed!\n\n"
        f"Order ID: {order_id}\n"
        f"Amount: ₹{amount}\n"
        f"Pickup Time: {pickup_time}\n\n"
        f"Thank you for ordering!"
    )

    twilio_client.messages.create(
        body=message,
        from_=settings.TWILIO_PHONE_NUMBER,
        to=phone,
    )
