from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pymongo import ReturnDocument
from datetime import timedelta, timezone
import os
from dotenv import load_dotenv

load_dotenv()

IST = timezone(timedelta(hours=5, minutes=30))

app = FastAPI(title="E-Canteen Backend")

# ================= CORS =================
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex="https://.*vercel.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= DATABASE =================
from database import counters_collection

# ================= ROUTERS =================
from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

app.include_router(auth_router, prefix="/auth")
app.include_router(menu_router, prefix="/menu")
app.include_router(orders_router, prefix="/orders")
app.include_router(admin_router, prefix="/admin")
app.include_router(wallet_router, prefix="/wallet")
app.include_router(feedback_router, prefix="/feedback")

# ================= STATIC FILES =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ================= ORDER ID =================
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

# ================= HEALTH =================
@app.get("/health")
def health():
    return {"status": "ok"}

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}