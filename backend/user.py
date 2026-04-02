from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from enum import Enum
import re


# ================= ROLE ENUM =================

class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    faculty = "faculty"


# ================= COMMON EMAIL NORMALIZER =================

def normalize_email_value(v: str):
    return v.lower().strip()


# ================= REGISTER =================

class UserRegister(BaseModel):

    name: str = Field(..., min_length=2, max_length=100)

    email: EmailStr

    password: str = Field(..., min_length=8)

    role: UserRole = UserRole.student

    roll_number: Optional[str] = Field(None, max_length=20)

    @field_validator("email")
    def normalize_email(cls, v):
        return normalize_email_value(v)

    @field_validator("password")
    def validate_password(cls, v):

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must include lowercase letter")

        if not re.search(r"[0-9]", v):
            raise ValueError("Password must include a number")

        return v.strip()


# ================= LOGIN =================

class UserLogin(BaseModel):

    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("email")
    def normalize_email(cls, v):
        return normalize_email_value(v)


# ================= OTP REQUEST =================

class EmailRequest(BaseModel):

    email: EmailStr

    @field_validator("email")
    def normalize_email(cls, v):
        return normalize_email_value(v)


# ================= OTP VERIFY =================

class VerifyOTPSchema(BaseModel):

    email: EmailStr
    otp: str = Field(..., min_length=4, max_length=6)

    @field_validator("email")
    def normalize_email(cls, v):
        return normalize_email_value(v)


# ================= USER RESPONSE =================

class UserResponse(BaseModel):

    id: str
    name: Optional[str] = None
    email: EmailStr
    role: UserRole

    class Config:
        from_attributes = True


# ================= LOGIN RESPONSE =================

class LoginResponse(BaseModel):

    access_token: str
    token_type: str = "bearer"
    expires_in_days: int
    user: UserResponse