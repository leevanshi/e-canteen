from pydantic import BaseSettings


class Settings(BaseSettings)
    # Razorpay
    RAZORPAY_KEY_ID str
    RAZORPAY_KEY_SECRET str

    # Twilio (SMS)
    TWILIO_ACCOUNT_SID str
    TWILIO_AUTH_TOKEN str
    TWILIO_PHONE_NUMBER str

    class Config
        env_file = .env
        env_file_encoding = utf-8


settings = Settings()
