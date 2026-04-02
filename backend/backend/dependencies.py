from fastapi import Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pymongo import MongoClient
from bson import ObjectId

security = HTTPBearer()

SECRET_KEY = "SUPER_SECRET_KEY"
ALGORITHM = "HS256"

client = MongoClient("mongodb://localhost:27017")
db = client["ecanteen"]
users_collection = db["users"]

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
):
    try:
        token = credentials.credentials

        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        user_id = payload.get("user_id")
        role = payload.get("role")

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")

        user = users_collection.find_one({"_id": ObjectId(user_id)})

        if not user:
            raise HTTPException(status_code=401, detail="User not found")

        return {
            "id": str(user["_id"]),
            "email": user["email"],
            "role": user["role"]
        }

    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
