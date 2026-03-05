
from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


# ================= ROLE ENUM =================
class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    faculty = "faculty"


# ================= REGISTER =================
class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

    roll_number: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=15)

    # Wallet initialization flag
    is_wallet_initialized: bool = False


# ================= LOGIN =================
class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)


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