from fastapi import APIRouter, Depends, HTTPException, Query, Header
from pydantic import BaseModel
from typing import List
from bson import ObjectId
from datetime import datetime, timedelta, timezone
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/admin", tags=["Admin"])

from database import (
    orders_collection,
    users_collection,
    wallet_collection,
    wallet_txn_collection,
)
from services.order_id_service import next_walkin_order, format_order_code
from services.analytics_service import get_analytics_data
from services.reports_service import generate_report
from database import order_status_history_collection

from routes.auth import get_current_user, get_current_user_optional, hash_password
import os
from server import manager
from email_service import send_order_status_update
from services.audit import log_audit


# ================= HELPERS =================

def ensure_admin(user: dict):
    if not user or user.get("role") != "admin":
        raise HTTPException(403, "Admin access required")


# Admin register secret (allows one-time admin creation without existing admin)
ADMIN_REGISTER_SECRET = os.getenv("ADMIN_REGISTER_SECRET")


class AdminCreateSchema(BaseModel):
    name: str
    email: str
    password: str


def serialize_order(o):

    created = o.get("created_at")

    return {
        "_id": str(o["_id"]),
        "order_id": o.get("order_id"),
        "order_code": format_order_code(o),
        "user_name": o.get("user_name"),
        "order_type": o.get("order_type"),
        "payment_method": o.get("payment_method"),
        "payment_status": o.get("payment_status"),
        "items": o.get("items", []),
        "total_amount": o.get("total_amount"),
        "status": o.get("status"),
        "status_history": o.get("status_history", []),
        "created_at": created.isoformat() if created else None,
    }


# ================= SCHEMAS =================

class OrderItem(BaseModel):
    name: str
    quantity: int
    price: float


class OrderStatusUpdate(BaseModel):
    status: str


class AdminPlaceOrder(BaseModel):
    items: List[OrderItem]
    total_amount: float


# ================= GET ALL ORDERS =================

@router.get("/orders")
def get_admin_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    skip = (page - 1) * limit

    orders = (
        orders_collection
        .find()
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [serialize_order(o) for o in orders]


@router.post("/create-admin")
def create_admin_user(
    data: AdminCreateSchema,
    x_admin_register_secret: str | None = Header(None, convert_underscores=False),
    current_user=Depends(get_current_user_optional)
):
    """Create an admin account. Allowed only if the caller is already an admin, or the
    correct ADMIN_REGISTER_SECRET is provided in header `X-Admin-Register-Secret`.
    """

    # If caller is admin, allow. Otherwise check secret header.
    caller_is_admin = bool(current_user and current_user.get("role") == "admin")
    secret_ok = bool(ADMIN_REGISTER_SECRET and x_admin_register_secret == ADMIN_REGISTER_SECRET)

    if not (caller_is_admin or secret_ok):
        raise HTTPException(403, "Admin creation requires admin authentication or valid secret")

    # Basic validation
    email = data.email.strip().lower()

    if users_collection.find_one({"email": email}):
        raise HTTPException(409, "User with this email already exists")

    user_doc = {
        "name": data.name.strip().title(),
        "email": email,
        "password": hash_password(data.password),
        "role": "admin",
        "created_at": datetime.now(IST)
    }

    users_collection.insert_one(user_doc)

    # Audit
    try:
        log_audit("create_admin", user_id=current_user.get("_id") if current_user else None, details={"email": email})
    except Exception:
        pass

    return {"message": "Admin user created"}


# ================= UPDATE ORDER STATUS =================

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    status = data.status.lower()

    allowed_transitions = {
        "pending": ["confirmed", "cancelled"],
        "confirmed": ["preparing", "cancelled"],
        "preparing": ["cooking", "cancelled"],
        "cooking": ["packaging", "cancelled"],
        "packaging": ["ready", "cancelled"],
        "ready": ["completed"],
        "completed": [],
        "cancelled": []
    }

    if order_id.isdigit():
        query = {"order_id": int(order_id)}
    else:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(400, "Invalid order ID")
        query = {"_id": ObjectId(order_id)}

    order = orders_collection.find_one(query)

    if not order:
        raise HTTPException(404, "Order not found")

    current_status = order["status"]

    if status not in allowed_transitions.get(current_status, []):
        raise HTTPException(400, "Invalid status transition")

    now = datetime.now(IST)

    updated = orders_collection.find_one_and_update(
        query,
        {
            "$set": {"status": status, "updated_at": now},
        },
        return_document=ReturnDocument.AFTER
    )

    # Save status history to separate collection
    order_status_history_collection.insert_one({
        "order_id": str(updated.get("order_id") or updated.get("_id")),
        "status": status,
        "updated_by": str(current_user["_id"]),
        "timestamp": now
    })

    # REALTIME UPDATE
    await manager.broadcast({
        "type": "order_status_update",
        "order_id": updated["order_id"],
        "status": status
    })

    if updated.get("user_email"):
        try:
            await send_order_status_update(
                email=updated["user_email"],
                order_id=str(updated["order_id"]),
                status=status
            )
        except Exception as e:
            print("Order status email failed:", e)

    # Audit
    try:
        log_audit("order_status_update", user_id=current_user.get("_id"), details={"order_id": str(updated.get("order_id")), "status": status})
    except Exception:
        pass

    return {"success": True, "status": status}


# ================= WALK-IN ORDER =================

@router.post("/place-order")
async def place_walkin_order(
    data: AdminPlaceOrder,
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    if not data.items:
        raise HTTPException(400, "Order must contain items")

    if data.total_amount <= 0:
        raise HTTPException(400, "Invalid total amount")

    for item in data.items:
        if item.quantity <= 0 or item.price <= 0:
            raise HTTPException(400, "Invalid item data")

    now = datetime.now(IST)

    order_id, order_code = next_walkin_order()

    order = {
        "order_id": order_id,
        "order_code": order_code,
        "order_type": "walk-in",
        "user_id": None,
        "user_name": "Walk-in Customer",
        "admin_id": ObjectId(current_user["_id"]),
        "items": [i.model_dump() for i in data.items],
        "total_amount": data.total_amount,
        "payment_method": "cash",
        "payment_status": "paid",
        "status": "pending",
        "status_history": [{"status": "pending", "time": now}],
        "created_at": now,
        "updated_at": now,
    }

    result = orders_collection.insert_one(order)

    order["_id"] = str(result.inserted_id)

    await manager.broadcast({
        "type": "new_order",
        "order": serialize_order(order)
    })

    # Audit
    try:
        log_audit("place_walkin_order", user_id=current_user.get("_id"), details={"order_id": order_id, "total": data.total_amount})
    except Exception:
        pass

    return {
        "success": True,
        "order_id": order_id,
        "order_code": order_code,
        "order": serialize_order(order),
    }


# ================= USERS LIST =================

@router.get("/users")
def get_users(
    limit: int = Query(200, le=500),
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    users_cursor = list(
        users_collection.find(
            {},
            {"password": 0, "refresh_token": 0}
        ).limit(limit)
    )

    users = []

    for u in users_cursor:

        wallet = wallet_collection.find_one({
            "user_id": ObjectId(str(u["_id"]))
        })

        users.append({
            "_id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role"),
            "wallet_balance": wallet.get("balance", 0) if wallet else 0
        })

    return users


# ================= WALLET HISTORY =================

@router.get("/wallet-history")
def wallet_history(
    limit: int = Query(200, le=500),
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    txns = wallet_txn_collection.find().sort("created_at", -1).limit(limit)

    result = []

    for t in txns:

        result.append({
            "_id": str(t["_id"]),
            "user_id": str(t["user_id"]),
            "amount": t["amount"],
            "type": t["type"],
            "source": t.get("source"),
            "admin_id": str(t.get("admin_id")) if t.get("admin_id") else None,
            "order_id": t.get("order_id"),
            "created_at": t["created_at"].isoformat()
        })

    return result


# ================= ANALYTICS =================

@router.get("/analytics")
def get_analytics(current_user=Depends(get_current_user)):
    ensure_admin(current_user)
    return get_analytics_data()


# ================= REPORTS =================

@router.get("/reports/{report_type}")
def get_report(report_type: str, current_user=Depends(get_current_user)):
    ensure_admin(current_user)
    if report_type not in ["daily", "weekly", "monthly"]:
        raise HTTPException(400, "Invalid report type. Use daily, weekly, or monthly.")
    return generate_report(report_type)