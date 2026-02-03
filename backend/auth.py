from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from pymongo import MongoClient
from passlib.context import CryptContext
from datetime import datetime
from jose import jwt
import os

# ================= ROUTER =================

router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ================= CONFIG =================
SECRET_KEY = os.getenv("SECRET_KEY", "supersecretkey")
ALGORITHM = "HS256"

# ================= DB =================
client = MongoClient("mongodb://localhost:27017")
db = client["ecanteen"]
users = db["users"]

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ================= SCHEMAS =================
class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginSchema(BaseModel):
    email: EmailStr
    password: str

# ================= HELPERS =================
def hash_password(password: str):
    return pwd_context.hash(password)

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict):
    return jwt.encode(data, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(token: str = Depends(lambda: None)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user = users.find_one({"_id": payload["id"]})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

# ================= REGISTER =================
@router.post("/register", status_code=status.HTTP_201_CREATED)
def register_admin(data: RegisterSchema):
    if users.find_one({"email": data.email}):
        raise HTTPException(status_code=400, detail="User already exists")

    users.insert_one({
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "admin",
        "is_wallet_initialized": False,
        "created_at": datetime.utcnow()
    })

    return {"message": "Admin registered successfully"}

# ================= LOGIN =================
@router.post("/login")
def login(data: LoginSchema):
    user = users.find_one({"email": data.email})
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "id": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "token": token,
        "user": {
            "id": str(user["_id"]),
            "name": user["name"],
            "email": user["email"],
            "role": user["role"]
        }
    }
