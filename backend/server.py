from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import timedelta, timezone
from pathlib import Path
from typing import List
import os
import asyncio

# ================= ENV =================
load_dotenv()

# ================= TIMEZONE =================
IST = timezone(timedelta(hours=5, minutes=30))

# ================= APP =================
app = FastAPI(
    title="E-Canteen Backend",
    version="1.0.0"
)

# ================= CORS =================
allowed_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= WEBSOCKET MANAGER =================
class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        async with self.lock:
            self.active_connections.append(websocket)

    async def disconnect(self, websocket: WebSocket):
        async with self.lock:
            if websocket in self.active_connections:
                self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        async with self.lock:
            connections = list(self.active_connections)

        disconnected = []

        for connection in connections:
            try:
                await connection.send_json(data)
            except Exception:
                disconnected.append(connection)

        for ws in disconnected:
            await self.disconnect(ws)

manager = ConnectionManager()

# ================= WEBSOCKET =================
@app.websocket("/ws/orders")
async def orders_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        await manager.disconnect(websocket)

# ================= DATABASE =================
from database import connect_with_retry, init_indexes, close_mongo_connection

# ================= EVENTS =================
from services.event_bus import subscribe
from services.order_events import (
    handle_wallet_deduction,
    handle_kitchen_log
)

# ================= STARTUP =================
@app.on_event("startup")
async def startup():
    connect_with_retry()
    init_indexes()

    subscribe("ORDER_CREATED", handle_wallet_deduction)
    subscribe("ORDER_CREATED", handle_kitchen_log)

    print("✅ Startup completed")

# ================= SHUTDOWN =================
@app.on_event("shutdown")
async def shutdown():
    close_mongo_connection()
    print("MongoDB closed")

# ================= ROUTERS =================
from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

app.include_router(auth_router)
app.include_router(wallet_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(feedback_router)

# ================= STATIC FILES =================
BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ================= HEALTH =================
@app.get("/health")
def health():
    return {"status": "ok"}

# ================= ROOT =================
@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}