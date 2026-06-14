import logging
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from datetime import timedelta, timezone
from pathlib import Path
from typing import List
import os
import asyncio
from services.audit import log_audit
from middleware.security_headers import SecurityHeadersMiddleware


# ================= ENV =================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

# ================= TIMEZONE =================

IST = timezone(timedelta(hours=5, minutes=30))

# ================= APP =================

logging.basicConfig(
    format="%(asctime)s [%(levelname)s] %(message)s",
    level=logging.INFO
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="E-Canteen Backend",
    version="1.0.0"
)

# ================= CORS =================

# Production CORS configuration
allowed_origins = [
    "https://ecanteen-nmims.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
]

# Also allow from environment variable if set
if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

if os.getenv("CORS_ORIGINS"):
    additional_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS").split(",")]
    allowed_origins.extend(additional_origins)

logger.info("CORS allowed origins: %s", allowed_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,
)

# Add security headers middleware
app.add_middleware(SecurityHeadersMiddleware)


@app.middleware("http")
async def log_requests(request: Request, call_next):
    try:
        print(f"REQUEST: {request.method} {request.url}")
    except Exception:
        pass

    response = await call_next(request)

    try:
        print(f"RESPONSE: {response.status_code} for {request.method} {request.url}")
    except Exception:
        pass

    return response

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

from database import connect_with_retry, init_indexes, close_mongo_connection, menu_collection
from services.nutrition_utils import ensure_menu_nutrition_seeded

# ================= EVENT SYSTEM =================

from services.event_bus import subscribe
from services.order_events import (
    handle_wallet_deduction,
    handle_kitchen_log
)

# ================= STARTUP =================

@app.on_event("startup")
async def startup():
    try:
        connect_with_retry()
        init_indexes()

        seeded = ensure_menu_nutrition_seeded(menu_collection)
        if seeded:
            logger.info("Seeded nutrition data for %s menu items", seeded)

        subscribe("ORDER_CREATED", handle_wallet_deduction)
        subscribe("ORDER_CREATED", handle_kitchen_log)

        logger.info("✅ Startup completed")
    except Exception as exc:
        logger.exception("Startup failed: %s", exc)
        raise

# ================= SHUTDOWN =================

@app.on_event("shutdown")
async def shutdown():
    close_mongo_connection()
    print("MongoDB closed")

# ================= ROUTERS =================

from routes.auth import router as auth_router, get_current_user_from_header
from routes.wallet import router as wallet_router
from routes.menu import router as menu_router
from routes.orders import router as orders_router
from routes.admin import router as admin_router, ADMIN_REGISTER_SECRET
from routes.feedback import router as feedback_router
from routes.inventory import router as inventory_router
from routes.monthly_menu import router as monthly_menu_router


def get_client_ip(request: Request) -> str | None:
    x_forwarded = request.headers.get("x-forwarded-for")
    if x_forwarded:
        return x_forwarded.split(",")[0].strip()
    return request.client.host if request.client else None


@app.middleware("http")
async def admin_path_guard(request: Request, call_next):
    path = request.url.path

    # Let CORS preflight through without auth checks
    if request.method == "OPTIONS":
        return await call_next(request)

    # Also allow health check without auth
    if path == "/health" or path == "/":
        return await call_next(request)

    # Check for admin routes (including wallet/admin)
    if path.startswith("/admin") or path.startswith("/wallet/admin"):
        auth_header = request.headers.get("authorization")
        secret_header = request.headers.get("x-admin-register-secret")
        client_ip = get_client_ip(request)

        def deny(status_code: int, detail: str, action: str, user_id: str | None = None):
            try:
                log_audit(action, user_id=user_id, ip=client_ip, details={"path": path, "detail": detail})
            except Exception:
                pass
            return JSONResponse(status_code=status_code, content={"detail": detail})

        if path == "/admin/create-admin":
            if secret_header and ADMIN_REGISTER_SECRET and secret_header == ADMIN_REGISTER_SECRET:
                return await call_next(request)

            if not auth_header:
                return deny(403, "Admin creation requires admin auth or valid secret", "admin_create_denied", None)

            try:
                user = get_current_user_from_header(auth_header)
                if user.get("role") != "admin":
                    return deny(403, "Admin role required", "admin_create_denied", user.get("_id"))
            except HTTPException as exc:
                return deny(exc.status_code, exc.detail, "admin_create_denied", None)

            return await call_next(request)

        if not auth_header:
            return deny(401, "Authorization required for admin routes", "admin_access_denied", None)

        try:
            user = get_current_user_from_header(auth_header)
            if user.get("role") != "admin":
                return deny(403, "Admin role required", "admin_access_denied", user.get("_id"))
        except HTTPException as exc:
            return deny(exc.status_code, exc.detail, "admin_access_denied", None)

    return await call_next(request)


app.include_router(auth_router)
app.include_router(menu_router)
app.include_router(orders_router)
app.include_router(admin_router)
app.include_router(wallet_router)
app.include_router(feedback_router)
app.include_router(inventory_router)
app.include_router(monthly_menu_router)


@app.on_event("startup")
async def print_registered_routes():
    logger.info("Registered routes:")
    for route in app.routes:
        try:
            logger.info(route.path)
        except Exception:
            pass

# ================= STATIC FILES =================

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_DIR = BASE_DIR / "uploads"

UPLOAD_DIR.mkdir(exist_ok=True)

app.mount("/uploads", StaticFiles(directory=str(UPLOAD_DIR)), name="uploads")

# ================= HEALTH =================

@app.get("/health")
async def health():
    return {"status": "ok"}

# ================= ROOT =================

@app.get("/")
def root():
    return {"status": "E-Canteen Backend Running 🚀"}