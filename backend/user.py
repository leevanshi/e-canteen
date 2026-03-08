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
    phone: Optional[str] = Field(None, max_length=15)

    @field_validator("password")
    def validate_password(cls, v):
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must include uppercase letter")
        if not re.search(r"[a-z]", v):
            raise ValueError("Password must include lowercase letter")
        if not re.search(r"[0-9]", v):
            raise ValueError("Password must include a number")
        return v

    @field_validator("phone")
    def validate_phone(cls, v):
        if v and not re.fullmatch(r"\+?\d{10,15}", v):
            raise ValueError("Invalid phone number")
        return v


# ================= LOGIN =================
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8)


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