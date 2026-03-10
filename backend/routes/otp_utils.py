import secrets

OTP_LENGTH = 6

def generate_otp() -> str:
    """
    Generate a cryptographically secure numeric OTP.
    """

    min_value = 10 ** (OTP_LENGTH - 1)
    max_range = 9 * min_value

    otp = secrets.randbelow(max_range) + min_value
    return str(otp)