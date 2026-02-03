from fastapi import APIRouter, HTTPException, status, Header
from pydantic import BaseModel
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import jwt, JWTError
from bson import ObjectId

from database import users_collection

# ================= CONFIG =================

SECRET_KEY = "SECRET123"
ALGORITHM = "HS256"

router = APIRouter(prefix="/auth", tags=["Auth"])

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# ================= SCHEMAS =================

class LoginSchema(BaseModel):
    email: str
    password: str
    

class ResetPasswordModel(BaseModel):
    email: str
    password: str




# ================= HELPERS =================

def verify_password(plain, hashed):
    return pwd_context.verify(plain, hashed)

def create_token(data: dict, minutes: int = 720):
    to_encode = data.copy()
    to_encode["exp"] = datetime.utcnow() + timedelta(minutes=minutes)
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ================= LOGIN =================

@router.post("/login")
def login(data: LoginSchema):
    user = users_collection.find_one({"email": data.email.lower()})

    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )

    token = create_token({
        "user_id": str(user["_id"]),
        "role": user.get("role", "student"),
    })

    return {
        "access_token": token,
        "user": {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user.get("role", "student"),
        },
    }
@router.post("/reset-password")
def reset_password(data: ResetPasswordModel):
    user = users_collection.find_one({"email": data.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    hashed = pwd_context.hash(data.password)

    users_collection.update_one(
        {"email": data.email},
        {"$set": {"password": hashed}}
    )

    return {"message": "Password updated"}
# ================= AUTH DEPENDENCY =================

def get_current_user(authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Token missing")

    try:
        # "Bearer TOKEN"
        token = authorization.split(" ")[1]

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = users_collection.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        user["_id"] = str(user["_id"])
        return user

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
