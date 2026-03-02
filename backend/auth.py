from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr, validator
from database import users_collection
from passlib.context import CryptContext
from datetime import datetime, timedelta
from jose import jwt, JWTError
from bson import ObjectId
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
import os
import logging

# ================= LOAD ENV =================
load_dotenv()

# ================= ROUTER =================
router = APIRouter(prefix="/auth", tags=["Auth"])

# ================= LOGGING =================
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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

# ================= DB INDEX =================
try:
    users_collection.create_index("email", unique=True)
except Exception as e:
    logger.warning(f"Index creation skipped: {str(e)}")

# ================= SCHEMAS =================
class LoginSchema(BaseModel):
    email: EmailStr
    password: str

class AdminRegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str

    @validator("password")
    def strong_password(cls, v):
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v

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

        user_id = payload.get("sub")

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

    except JWTError as e:
        logger.error(f"JWT Error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )

# ================= ROLE GUARD =================
def require_admin(user=Depends(get_current_user)):
    if user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user

# ================= ADMIN REGISTER =================
@router.post("/admin/register", status_code=status.HTTP_201_CREATED)
def register_admin(data: AdminRegisterSchema):
    # 🚨 Block if admin already exists
    existing_admin = users_collection.find_one({"role": "admin"})
    if existing_admin:
        raise HTTPException(
            status_code=403,
            detail="Admin already exists"
        )

    email = data.email.lower().strip()

    if users_collection.find_one({"email": email}):
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
        "sub": str(user["_id"]),
        "role": user["role"]
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "expires_in_days": ACCESS_TOKEN_EXPIRE_DAYS,
        "user": {
            "id": str(user["_id"]),
            "name": user.get("name"),
            "email": user.get("email"),
            "role": user.get("role")
        }
    }

# ================= SAMPLE ADMIN ROUTE =================
@router.get("/admin/me")
def get_admin_profile(user=Depends(require_admin)):
    return {
        "message": "Welcome Admin",
        "user": user
    }