from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from dotenv import load_dotenv
from datetime import timedelta, timezone

load_dotenv()

IST = timezone(timedelta(hours=5, minutes=30))

app = FastAPI(
    title="E-Canteen Backend",
    version="1.0.0"
)

# ================= CORS =================
allowed_origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://ecanteen-nmims.vercel.app"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex="https://ecanteen-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= ROUTERS =================
from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

# Routers already have prefixes inside their files
app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(wallet_router)
app.include_router(feedback_router)

# ================= STATIC FILES =================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_DIR = os.path.join(BASE_DIR, "uploads")

os.makedirs(UPLOAD_DIR, exist_ok=True)

app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

# ================= HEALTH =================
@app.get("/health")
def health():
    return {"status": "ok"}

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}