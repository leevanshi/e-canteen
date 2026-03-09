from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import timedelta, timezone
from pathlib import Path
from typing import List
import os

load_dotenv()

# ================= TIMEZONE =================

IST = timezone(timedelta(hours=5, minutes=30))

# ================= APP =================

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
    allow_origin_regex=r"https://ecanteen-.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================= WEBSOCKET MANAGER =================

class ConnectionManager:

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        disconnected = []

        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except:
                disconnected.append(connection)

        for d in disconnected:
            self.disconnect(d)


manager = ConnectionManager()

# ================= ORDER WEBSOCKET =================

@app.websocket("/ws/orders")
async def orders_ws(websocket: WebSocket):

    await manager.connect(websocket)

    try:
        while True:
            # keep connection alive
            await websocket.receive_text()

    except WebSocketDisconnect:
        manager.disconnect(websocket)

# ================= ROUTERS =================

from routes.auth import router as auth_router
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router
from routes.feedback import router as feedback_router

app.include_router(auth_router, tags=["Auth"])
app.include_router(menu_router, tags=["Menu"])
app.include_router(orders_router, tags=["Orders"])
app.include_router(admin_router, tags=["Admin"])
app.include_router(wallet_router, tags=["Wallet"])
app.include_router(feedback_router, tags=["Feedback"])

# ================= STATIC FILES =================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ================= HEALTH =================

@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}

# ================= ROOT =================

@app.get("/", tags=["Root"])
def root():
    return {"status": "E-Canteen Backend Running 🚀"}