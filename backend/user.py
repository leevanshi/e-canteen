from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    faculty = "faculty"


class UserRegister(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6)

    roll_number: Optional[str] = Field(None, max_length=20)
    phone: Optional[str] = Field(None, max_length=15)

    # ✅ Wallet flag (better naming clarity)
    is_wallet_initialized: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=6)