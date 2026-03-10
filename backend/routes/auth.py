from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel, EmailStr, field_validator
from database import users_collection, otp_collection
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from jose import jwt, JWTError
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
import logging
import re
import time
from pymongo.errors import DuplicateKeyError
from collections import defaultdict

from otp_utils import generate_otp
from email_service import send_otp_email

# ================= LOAD ENV =================

load_dotenv()

router = APIRouter(prefix="/auth", tags=["Auth"])

# ================= LOGGING =================

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ================= SECURITY =================

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set")

security = HTTPBearer()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    bcrypt__rounds=12,
    deprecated="auto"
)

# ================= LOGIN RATE LIMIT =================

login_attempts = defaultdict(list)
MAX_ATTEMPTS = 5
ATTEMPT_WINDOW = 60

# ================= OTP RATE LIMIT =================

otp_requests = defaultdict(list)
OTP_MAX_REQUESTS = 3
OTP_WINDOW = 60

# ================= INDEX =================

users_collection.create_index("email", unique=True)

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


class ResetPasswordSchema(BaseModel):
    email: EmailStr
    password: str


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

        role = normalize_role(user.get("role"))

        return {
            "_id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )


# ================= ROLE GUARD =================


def require_admin(user=Depends(get_current_user)):

    if normalize_role(user.get("role")) != "admin":
        raise HTTPException(403, "Admin access required")

    return user


# ================= SEND OTP =================


@router.post("/send-otp")
async def send_otp(data: EmailRequest):

    email = normalize_email(data.email)

    allowed_domains = [
        "nmims.in",
        "nmims.edu.in",
        "nmims.edu"
    ]

    if email.split("@")[-1] not in allowed_domains:
        raise HTTPException(400, "Only NMIMS email allowed")

    # ===== RATE LIMIT =====

    now = time.time()

    otp_requests[email] = [
        t for t in otp_requests[email]
        if now - t < OTP_WINDOW
    ]

    if len(otp_requests[email]) >= OTP_MAX_REQUESTS:
        raise HTTPException(
            429,
            "Too many OTP requests. Please wait a minute."
        )

    otp_requests[email].append(now)

    otp = generate_otp()

    expires = datetime.now(timezone.utc) + timedelta(minutes=5)

    otp_collection.delete_many({"email": email})

    otp_collection.insert_one({
        "email": email,
        "otp": otp,
        "expires_at": expires,
        "verified": False
    })

    await send_otp_email(email, otp)

    logger.info(f"OTP sent to {email}")

    return {"message": "OTP sent to email"}


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

    if record["expires_at"] < datetime.now(timezone.utc):
        raise HTTPException(400, "OTP expired")

    otp_collection.update_one(
        {"email": email},
        {"$set": {"verified": True}}
    )

    return {"message": "OTP verified successfully"}


# ================= REGISTER =================


@router.post("/register", status_code=201)
def register_user(data: RegisterSchema):

    email = normalize_email(data.email)
    role = normalize_role(data.role)

    allowed_domains = [
        "nmims.in",
        "nmims.edu.in",
        "nmims.edu"
    ]

    if email.split("@")[-1] not in allowed_domains:
        raise HTTPException(400, "Only NMIMS email allowed")

    if role not in ["student", "faculty"]:
        raise HTTPException(400, "Invalid role")

    record = otp_collection.find_one({"email": email})

    if not record or not record.get("verified"):
        raise HTTPException(400, "Email not verified with OTP")

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

    return {"message": f"{role.capitalize()} registered successfully"}


# ================= RESET PASSWORD =================


@router.post("/reset-password")
def reset_password(data: ResetPasswordSchema):

    email = normalize_email(data.email)

    user = users_collection.find_one({"email": email})

    if not user:
        raise HTTPException(404, "User not found")

    users_collection.update_one(
        {"email": email},
        {"$set": {"password": hash_password(data.password)}}
    )

    logger.info(f"Password reset for {email}")

    return {"message": "Password updated successfully"}


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
        raise HTTPException(
            429,
            "Too many login attempts. Try again later."
        )

    user = users_collection.find_one({"email": email})

    if not user or "password" not in user:
        login_attempts[email].append(now)
        raise HTTPException(401, "Invalid credentials")

    if not verify_password(data.password, user["password"]):
        login_attempts[email].append(now)
        raise HTTPException(401, "Invalid credentials")

    login_attempts[email] = []

    role = normalize_role(user.get("role"))

    token = create_token({
        "sub": str(user["_id"]),
        "role": role
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_days": ACCESS_TOKEN_EXPIRE_DAYS,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": role
        }
    }


# ================= ADMIN TEST =================


@router.get("/admin/me")
def get_admin_profile(user=Depends(require_admin)):

    return {
        "message": "Welcome Admin",
        "user": user
    }