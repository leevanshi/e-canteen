from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from database import users_collection, otp_collection
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from pathlib import Path
import os
import logging
import re
import time
from pymongo.errors import DuplicateKeyError
from collections import defaultdict

load_dotenv(dotenv_path=Path(__file__).resolve().parent.parent / ".env")

from otp_utils import generate_otp
from email_config import MAIL_SUPPRESS_SEND, MAIL_DEBUG
from email_service import send_otp_email, send_welcome_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["Auth"])

# ================= LOGGING =================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================= SECURITY =================
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

# ❗ safer: don't crash app silently
if not SECRET_KEY:
    logger.warning("⚠️ SECRET_KEY not set. Using fallback (DEV ONLY)")
    SECRET_KEY = "dev-secret-key"

security = HTTPBearer()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__rounds=12,
    deprecated="auto"
)

# ================= RATE LIMIT =================
login_attempts = defaultdict(list)
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW = 60

otp_requests = defaultdict(list)
OTP_MAX_REQUESTS = 3
OTP_WINDOW = 60

# ================= SCHEMAS =================

class LoginSchema(BaseModel):
    email: EmailStr
    password: str


class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str

    @field_validator("password")
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Must include uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Must include lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Must include a number")
        return v

    @field_validator("name")
    def normalize_name(cls, v):
        return v.strip().title()


class EmailRequest(BaseModel):
    email: EmailStr


class VerifyOTPSchema(BaseModel):
    email: EmailStr
    otp: str

    @field_validator("otp")
    def validate_otp(cls, v):
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("OTP must be 6 digits")
        return v


class ResetPasswordSchema(BaseModel):
    email: EmailStr
    password: str

    @field_validator("password")
    def strong_password(cls, v):
        if len(v) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", v):
            raise ValueError("Must include uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Must include lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Must include a number")
        return v


# ================= HELPERS =================

def normalize_email(email: str) -> str:
    return email.lower().strip()


def normalize_role(role: str) -> str:
    return (role or "student").lower().strip()


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)


def create_token(data: dict):
    now = datetime.now(timezone.utc)

    payload = {
        **data,
        "type": "access",
        "exp": now + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "iat": now
    }

    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


# ================= CURRENT USER =================

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(401, "Invalid token type")

        user_id = payload.get("sub")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(401, "Invalid token")

        user = users_collection.find_one(
            {"_id": ObjectId(user_id)},
            {"password": 0}
        )

        if not user:
            raise HTTPException(401, "User not found")

        return {
            "_id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": normalize_role(user.get("role"))
        }

    except JWTError:
        raise HTTPException(401, "Invalid or expired token")


# ================= SEND OTP (Registration) =================

@router.post("/send-otp")
async def send_otp(data: EmailRequest):

    email = normalize_email(data.email)

    # 🔒 STRICT NMIMS VALIDATION
    if not re.match(r"^[a-zA-Z0-9._%+-]+@(nmims\.in|nmims\.edu\.in|nmims\.edu)$", email):
        raise HTTPException(400, "Only NMIMS email allowed")

    now = time.time()

    otp_requests[email] = [
        t for t in otp_requests[email]
        if now - t < OTP_WINDOW
    ]

    if len(otp_requests[email]) >= OTP_MAX_REQUESTS:
        raise HTTPException(429, "Too many OTP requests")

    otp_requests[email].append(now)

    otp = str(generate_otp())  # ensure string
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_collection.delete_many({"email": email})

    otp_collection.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": expires,
        "verified": False
    })

    try:
        await send_otp_email(email, otp)
    except Exception as e:
        logger.error(f"Email failed: {e}")
        if MAIL_SUPPRESS_SEND or MAIL_DEBUG:
            logger.warning("OTP email send bypassed due to local debug or suppressed email mode")
        else:
            raise HTTPException(500, f"Failed to send OTP email: {e}")

    logger.info(f"OTP sent to {email} | OTP: {otp}")

    # ⚠️ DEBUG ONLY (remove in production)
    return {
        "message": "OTP sent to email",
        "otp": otp
    }


# ================= SEND OTP (Forgot Password — registered users only) =================

@router.post("/send-reset-otp")
async def send_reset_otp(data: EmailRequest):

    email = normalize_email(data.email)

    # 🔒 NMIMS email validation
    if not re.match(r"^[a-zA-Z0-9._%+-]+@(nmims\.in|nmims\.edu\.in|nmims\.edu)$", email):
        raise HTTPException(400, "Only NMIMS email allowed")

    # ✅ Check the email is actually registered
    user = users_collection.find_one({"email": email})
    if not user:
        raise HTTPException(404, "No account found with this email address")

    now = time.time()

    otp_requests[email] = [
        t for t in otp_requests[email]
        if now - t < OTP_WINDOW
    ]

    if len(otp_requests[email]) >= OTP_MAX_REQUESTS:
        raise HTTPException(429, "Too many OTP requests")

    otp_requests[email].append(now)

    otp = str(generate_otp())
    expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_collection.delete_many({"email": email})

    otp_collection.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": expires,
        "verified": False
    })

    try:
        await send_otp_email(email, otp)
    except Exception as e:
        logger.error(f"Email failed: {e}")
        if MAIL_SUPPRESS_SEND or MAIL_DEBUG:
            logger.warning("Reset OTP email send bypassed due to local debug or suppressed email mode")
        else:
            raise HTTPException(500, "Failed to send OTP email")

    logger.info(f"Reset OTP sent to {email}")

    response = {"message": "OTP sent to your registered email"}
    if MAIL_SUPPRESS_SEND or MAIL_DEBUG:
        response["otp"] = otp

    return response


# ================= VERIFY OTP =================

@router.post("/verify-otp")
def verify_otp(data: VerifyOTPSchema):

    email = normalize_email(data.email)

    record = otp_collection.find_one({
        "email": email,
        "otp": data.otp
    })

    if not record:
        raise HTTPException(400, "Invalid OTP")

    # handle naive datetimes stored in MongoDB by assuming UTC
    expires_at = record.get("expires_at")
    if getattr(expires_at, "tzinfo", None) is None:
        from datetime import timezone as _tz
        expires_at = expires_at.replace(tzinfo=_tz.utc)

    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(400, "OTP expired")

    otp_collection.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )

    return {"message": "OTP verified successfully"}


# ================= REGISTER =================

@router.post("/register")
async def register_user(data: RegisterSchema):

    email = normalize_email(data.email)
    role = normalize_role(data.role)

    if role not in ["student", "faculty"]:
        raise HTTPException(400, "Invalid role")

    record = otp_collection.find_one({"email": email})

    if not record or not record.get("verified"):
        raise HTTPException(400, "Email not verified")

    try:
        users_collection.insert_one({
            "name": data.name,
            "email": email,
            "password": hash_password(data.password),
            "role": role,
            "created_at": datetime.now(timezone.utc)
        })

        otp_collection.delete_many({"email": email})

    except DuplicateKeyError:
        raise HTTPException(409, "User already exists")

    # ✉️ Send welcome email (non-blocking – failure won't break registration)
    try:
        await send_welcome_email(email, data.name, role)
    except Exception as e:
        logger.warning(f"Welcome email failed: {e}")

    return {"message": f"{role.capitalize()} registered successfully"}


# ================= LOGIN =================

@router.post("/login")
def login(data: LoginSchema):

    email = normalize_email(data.email)
    now = datetime.now().timestamp()

    login_attempts[email] = [
        t for t in login_attempts[email]
        if now - t < ATTEMPT_WINDOW
    ]

    if len(login_attempts[email]) >= MAX_ATTEMPTS:
        raise HTTPException(429, "Too many login attempts")

    user = users_collection.find_one({"email": email})

    if not user or not verify_password(data.password, user["password"]):
        login_attempts[email].append(now)
        raise HTTPException(401, "Invalid credentials")

    login_attempts[email] = []

    token = create_token({
        "sub": str(user["_id"]),
        "role": user.get("role")
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": normalize_role(user.get("role"))
        }
    }


# ================= RESET PASSWORD =================

@router.post("/reset-password")
async def reset_password(data: ResetPasswordSchema):

    email = normalize_email(data.email)

    # Check OTP was verified for this email
    record = otp_collection.find_one({"email": email})

    if not record or not record.get("verified"):
        raise HTTPException(400, "Email not verified via OTP")

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(404, "User not found")

    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hash_password(data.password)}}
    )

    otp_collection.delete_many({"email": email})

    # ✉️ Send password reset confirmation email
    try:
        await send_password_reset_email(email, user.get("name", "User"))
    except Exception as e:
        logger.warning(f"Password reset email failed: {e}")

    return {"message": "Password reset successfully"}


# ================= TEST EMAIL (for diagnostics)
@router.post("/test-email")
async def test_email(data: EmailRequest):
    """Send a simple test/welcome email to verify delivery (useful for debugging SMTP/API)."""
    email = normalize_email(data.email)

    success = await send_welcome_email(email, "Test User", "student")
    if not success:
        logger.error("Test email failed: no delivery after SMTP/SendGrid attempts")
        raise HTTPException(500, "Failed to send test email: delivery could not be completed")

    return {"message": "Test email sent"}