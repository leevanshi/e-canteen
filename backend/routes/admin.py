from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from typing import List
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from pymongo import ReturnDocument

# ================= CONFIG =================

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/admin",
    tags=["Admin"]
)

# ================= DATABASE =================

from database import (
    orders_collection,
    users_collection,
    wallet_collection,
    wallet_txn_collection,
    counters_collection,
    menu_collection,
    client
)

# ================= AUTH =================

from routes.auth import get_current_user


# ================= HELPERS =================

def ensure_admin_or_staff(user: dict):
    if not user or user.get("role") not in ["admin", "staff"]:
        raise HTTPException(403, "Admin or Staff access required")


def serialize_order(o):

    created = o.get("created_at")

    return {
        "_id": str(o["_id"]),
        "order_id": o.get("order_id"),
        "user_name": o.get("user_name"),
        "order_type": o.get("order_type"),
        "payment_method": o.get("payment_method"),
        "payment_status": o.get("payment_status"),
        "items": o.get("items", []),
        "total_amount": o.get("total_amount"),
        "status": o.get("status"),
        "created_at": created.isoformat() if created else None
    }


# ================= ORDER COUNTER =================

def get_next_order_id() -> int:

    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {"$inc": {"seq": 1}, "$setOnInsert": {"seq": 99}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return counter["seq"]


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


class AvailabilityUpdate(BaseModel):
    available: bool


# ================= GET ALL ORDERS =================

@router.get("/orders")
def get_admin_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(50, le=200),
    current_user=Depends(get_current_user)
):

    ensure_admin_or_staff(current_user)

    skip = (page - 1) * limit

    orders = (
        orders_collection
        .find()
        .sort("created_at", -1)
        .skip(skip)
        .limit(limit)
    )

    return [serialize_order(o) for o in orders]


# ================= UPDATE ORDER STATUS =================

@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):

    ensure_admin_or_staff(current_user)

    allowed = ["pending", "preparing", "completed", "cancelled"]

    status = data.status.lower()

    if status not in allowed:
        raise HTTPException(400, "Invalid order status")

    now = datetime.now(IST)

    if order_id.isdigit():
        query = {"order_id": int(order_id)}
    else:

        if not ObjectId.is_valid(order_id):
            raise HTTPException(400, "Invalid order ID")

        query = {"_id": ObjectId(order_id)}

    result = orders_collection.update_one(
        query,
        {
            "$set": {"status": status, "updated_at": now},
            "$push": {
                "status_history": {
                    "status": status,
                    "time": now
                }
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Order not found")

    return {"success": True, "status": status}


# ================= WALK-IN ORDER (WITH TRANSACTION) =================

@router.post("/place-order")
def place_walkin_order(
    data: AdminPlaceOrder,
    current_user=Depends(get_current_user)
):

    ensure_admin_or_staff(current_user)

    if not data.items:
        raise HTTPException(400, "Order must contain items")

    if data.total_amount <= 0:
        raise HTTPException(400, "Invalid total amount")

    now = datetime.now(IST)

    order_id = get_next_order_id()

    order = {
        "order_id": order_id,
        "order_type": "walk-in",
        "user_id": None,
        "user_name": "Walk-in Customer",
        "items": [i.dict() for i in data.items],
        "total_amount": data.total_amount,
        "payment_method": "counter",
        "payment_status": "paid",
        "status": "pending",
        "status_history": [{"status": "pending", "time": now}],
        "created_at": now,
        "updated_at": now
    }

    orders_collection.insert_one(order)

    return {
        "success": True,
        "order_id": order_id
    }


# ================= USERS LIST =================

@router.get("/users")
def get_users(
    limit: int = Query(200, le=500),
    current_user=Depends(get_current_user)
):

    ensure_admin_or_staff(current_user)

    users = []

    for u in users_collection.find(
        {},
        {"password": 0, "refresh_token": 0}
    ).limit(limit):

        wallet = wallet_collection.find_one(
            {"user_id": ObjectId(u["_id"])}
        )

        balance = wallet.get("balance", 0) if wallet else 0

        users.append({
            "_id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role"),
            "wallet_balance": balance
        })

    return users


# ================= WALLET HISTORY =================

@router.get("/wallet-history")
def wallet_history(
    limit: int = Query(200, le=500),
    current_user=Depends(get_current_user)
):

    ensure_admin_or_staff(current_user)

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