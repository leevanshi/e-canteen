from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import ReturnDocument
from datetime import datetime, timedelta, timezone
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from bson import ObjectId
from passlib.context import CryptContext
import os
from dotenv import load_dotenv

# ❌ REMOVE THIS (wrong import here)
# from routes.auth import get_current_user

load_dotenv()

# ================= TIMEZONE =================
IST = timezone(timedelta(hours=5, minutes=30))

# ================= APP =================
app = FastAPI(title="E-Canteen Backend")

# ================= PASSWORD HASH =================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*vercel.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE =================
from database import (
    wallet_collection,
    menu_collection,
    orders_collection,
    users_collection,
    counters_collection,
)

# ================= ROUTERS =================
from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

# ✅ KEEP ONLY ROUTERS (NO DUPLICATE APIs BELOW)
app.include_router(auth_router)
app.include_router(wallet_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(feedback_router)

# ================= STATIC FILES =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ================= ORDER ID COUNTER =================
def get_next_order_id():
    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {"$inc": {"value": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
    )

    if counter["value"] < 101:
        counters_collection.update_one(
            {"_id": "order_id"},
            {"$set": {"value": 101}},
        )
        return 101

    return counter["value"]

# ================= SCHEMAS =================
class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str

# ================= REGISTER =================
@app.post("/auth/register")
def register_user(data: RegisterUser):
    if not data.email.endswith("@nmims.in"):
        raise HTTPException(status_code=400, detail="Only NMIMS email allowed")

    if users_collection.find_one({"email": data.email}):
        raise HTTPException(status_code=409, detail="Email already registered")

    user_doc = {
        "name": data.name,
        "email": data.email,
        "password": hash_password(data.password),
        "role": "student",
    }

    result = users_collection.insert_one(user_doc)

    return {
        "success": True,
        "user_id": str(result.inserted_id),
        "message": "User registered successfully",
    }

# ================= HEALTH CHECK =================
@app.get("/health")
def health():
    return {"status": "ok"}

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}