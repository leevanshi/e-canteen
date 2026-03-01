from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from database import users_collection
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import os

# ================= ROUTER =================
router = APIRouter(prefix="/auth", tags=["Auth"])

# ================= SECURITY =================
SECRET_KEY = os.getenv("SECRET_KEY")
if not SECRET_KEY:
    raise ValueError("SECRET_KEY must be set in environment variables")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 7

security = HTTPBearer()

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)

# ================= SCHEMAS =================
class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class AdminRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

# ================= HELPERS =================
def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)

def create_token(data: dict) -> str:
    payload = data.copy()
    payload.update({
        "type": "access",
        "exp": datetime.utcnow() + timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS),
        "iat": datetime.utcnow(),
    })
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

# ================= CURRENT USER =================
def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    if credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication scheme"
        )

    token = credentials.credentials

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        if payload.get("type") != "access":
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token type"
            )

        user_id = payload.get("id")

        if not user_id or not ObjectId.is_valid(user_id):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )

        return {
            "_id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role"),
        }

    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# ================= ADMIN REGISTER =================
@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
def register_admin(data: AdminRegisterSchema):
    email = data.email.lower().strip()

    existing_user = users_collection.find_one({"email": email})
    if existing_user:
        raise HTTPException(status_code=409, detail="User already exists")

    users_collection.insert_one({
        "name": data.name.strip(),
        "email": email,
        "password": hash_password(data.password),
        "role": "admin",
        "created_at": datetime.utcnow()
    })

    return {"message": "Admin registered successfully"}

# ================= LOGIN =================
@router.post("/login")
def login(data: LoginSchema):
    email = data.email.lower().strip()
    user = users_collection.find_one({"email": email})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_token({
        "id": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role")
        }
    }