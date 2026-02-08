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
from fastapi.responses import Response
from fastapi import Request
from dotenv import load_dotenv
from routes.auth import get_current_user


load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), ".env"))

# ================= TIMEZONE =================
IST = timezone(timedelta(hours=5, minutes=30))

# ================= APP =================
app = FastAPI(title="E-Canteen Backend")

# ================= PASSWORD HASH =================
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str):
    return pwd_context.hash(password)

# ================= CORS =================
# ================= CORS =================
origins = os.getenv("CORS_ORIGINS")

if origins:
    origins = [o.strip() for o in origins.split(",")]
else:
    # fallback for local + production
    origins = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "https://ecanteen-nmims.vercel.app/",
    ]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],  # REQUIRED for Authorization
)

# ================= DATABASE =================
from database import (
    wallet_collection,
    menu_collection,
    orders_collection,
    users_collection,
    counters_collection,
)
from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

app.include_router(auth_router, prefix="/api")
app.include_router(wallet_router, prefix="/api")
app.include_router(menu_router, prefix="/api")
app.include_router(orders_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(feedback_router, prefix="/api")



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
            {"$set": {"value": 101}}
        )
        return 101

    return counter["value"]

# ================= SCHEMAS =================
class OrderItem(BaseModel):
    item_id: str
    name: str
    price: float
    quantity: int

class CreateOrder(BaseModel):
    items: List[OrderItem]
    pickup_time: Optional[str] = None
    payment_method: str

class StatusUpdate(BaseModel):
    status: str

class RegisterUser(BaseModel):
    name: str
    email: EmailStr
    password: str

# ================= REGISTER =================


@app.post("/api/register")
def register_user(data: RegisterUser):
    try:
        # ONLY NMIMS EMAILS
        if not data.email.endswith("@nmims.in"):
            raise HTTPException(status_code=400, detail="Only NMIMS email allowed")

        existing_user = users_collection.find_one({"email": data.email})
        if existing_user:
            raise HTTPException(status_code=409, detail="Email already registered")

        user_doc = {
            "name": data.name,
            "email": data.email,
            "password": hash_password(data.password),
            "role": "student"
        }

        result = users_collection.insert_one(user_doc)

        return {
            "success": True,
            "user_id": str(result.inserted_id),
            "message": "User registered successfully"
        }

    except HTTPException:
        raise
    except Exception as e:
        print("REGISTER ERROR >>>", e)
        raise HTTPException(status_code=500, detail=str(e))

# ================= MENU =================
@app.get("/api/menu")
def get_menu():
    menu = []
    for item in menu_collection.find({"available": True}):
        item["_id"] = str(item["_id"])
        menu.append(item)
    return menu

# ================= STUDENT PLACE ORDER =================
@app.post("/api/orders")
def place_order(data: CreateOrder, user=Depends(get_current_user)):
    now = datetime.now(IST)
    order_id = get_next_order_id()

    total = sum(i.price * i.quantity for i in data.items)
    payment_status = "paid" if data.payment_method == "wallet" else "pending"

    if data.payment_method == "wallet":
        wallet = wallet_collection.find_one({"user_id": ObjectId(user["_id"])})
        if not wallet or wallet["balance"] < total:
            raise HTTPException(status_code=400, detail="Insufficient wallet balance")

        wallet_collection.update_one(
            {"user_id": ObjectId(user["_id"])},
            {"$inc": {"balance": -total}}
        )

    orders_collection.insert_one({
        "order_id": order_id,
        "order_source": "online",
        "user_id": ObjectId(user["_id"]),
        "user_name": user.get("name"),
        "items": [i.dict() for i in data.items],
        "total_amount": total,
        "pickup_time": data.pickup_time,
        "payment_method": data.payment_method,
        "payment_status": payment_status,
        "status": "pending",
        "status_history": [{"status": "pending", "time": now}],
        "created_at": now,
        "updated_at": now,
    })

    return {"success": True, "order_id": order_id}

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}
