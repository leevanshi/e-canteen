from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from enum import Enum
import re


# ================= ROLE ENUM =================

class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    faculty = "faculty"


# ================= REGISTER =================

class UserRegister(BaseModel):

    name: str = Field(..., min_length=2, max_length=100)

    email: EmailStr

    password: str = Field(..., min_length=8)

    role: UserRole = UserRole.student

    roll_number: Optional[str] = Field(None, max_length=20)

    # normalize email
    @field_validator("email")
    def normalize_email(cls, v):
        return v.lower().strip()

    # strong password validation
    @field_validator("password")
    def validate_password(cls, v):

        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include uppercase letter")

        if not re.search(r"[a-z]", v):
            raise ValueError("Password must include lowercase letter")

        if not re.search(r"[0-9]", v):
            raise ValueError("Password must include a number")

        return v


# ================= LOGIN =================

class UserLogin(BaseModel):

    email: EmailStr
    password: str = Field(..., min_length=8)

    @field_validator("email")
    def normalize_email(cls, v):
        return v.lower().strip()


# ================= OTP REQUEST =================

class EmailRequest(BaseModel):

    email: EmailStr

    @field_validator("email")
    def normalize_email(cls, v):
        return v.lower().strip()


# ================= OTP VERIFY =================

class VerifyOTPSchema(BaseModel):

    email: EmailStr
    otp: str


# ================= USER RESPONSE =================

class UserResponse(BaseModel):

    id: str
    name: Optional[str]
    email: EmailStr
    role: UserRole


# ================= LOGIN RESPONSE =================

class LoginResponse(BaseModel):

    access_token: str
    token_type: str
    expires_in_days: int
    user: UserResponse