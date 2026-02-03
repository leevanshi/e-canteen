from pydantic import BaseModel, EmailStr
from typing import Optional
from enum import Enum


class UserRole(str, Enum):
    admin = "admin"
    student = "student"
    faculty = "faculty"


class UserRegister(BaseModel):
    name: str
    email: EmailStr
    password: str
    roll_number: Optional[str] = None
    phone: Optional[str] = None

    # ✅ Wallet logic (default: not initialized)
    is_wallet_initialized: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str
