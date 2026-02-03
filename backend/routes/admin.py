from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from pymongo import ReturnDocument

# ================= CONFIG =================
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

# ================= DATABASE =================
from database import (
    orders_collection,
    users_collection,
    counters_collection,
    menu_collection   # ✅ FIXED (was missing)
)

# ================= AUTH =================
from routes.auth import get_current_user


# ================= HELPERS =================
def ensure_admin_or_staff(user: dict):
    if not user or user.get("role") not in ["admin", "staff"]:
        raise HTTPException(
            status_code=403,
            detail="Admin or Staff access required"
        )

# ================= ORDER ID COUNTER =================



def get_next_order_id() -> int:
    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    # If document was newly created, seq may start at 1
    return counter["seq"]

# ================= SCHEMAS =================
class OrderStatusUpdate(BaseModel):
    status: str

class AdminPlaceOrder(BaseModel):
    items: List[Dict[str, Any]]
    total_amount: float

# ✅ NEW MODEL (IMPORTANT)
class AvailabilityUpdate(BaseModel):
    available: bool


# ================= GET ALL ORDERS =================
@router.get("/orders")
def get_admin_orders():
    orders = orders_collection.find().sort("created_at", -1)

    result = []
    for o in orders:
        result.append({
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "user_name": o.get("user_name"),
            "order_type": o.get("order_type"),
            "payment_method": o.get("payment_method"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "created_at": o.get("created_at"),
        })

    return result


# ================= GET ONLINE ORDERS =================
@router.get("/orders/online")
def get_online_orders(current_user=Depends(get_current_user)):
    ensure_admin_or_staff(current_user)

    orders = orders_collection.find(
        {"order_type": "online"}
    ).sort("created_at", 1)

    result = []
    for o in orders:
        result.append({
            "_id": str(o["_id"]),
            "user_id": str(o["user_id"]),
            "user_name": o["user_name"],
            "items": o["items"],
            "total_amount": o["total_amount"],
            "status": o["status"],
            "created_at": o["created_at"]
        })

    return result


# ================= UPDATE ORDER STATUS =================
@router.put("/orders/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):
    ensure_admin_or_staff(current_user)

    if data.status not in ["pending", "preparing", "completed", "cancelled"]:
        raise HTTPException(status_code=400, detail="Invalid order status")

    now = datetime.now(IST)

    query = (
        {"order_id": int(order_id)}
        if order_id.isdigit()
        else {"_id": ObjectId(order_id)}
    )

    result = orders_collection.update_one(
        query,
        {
            "$set": {
                "status": data.status,
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": data.status,
                    "time": now
                }
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")

    return {
        "success": True,
        "order_id": order_id,
        "status": data.status
    }


# ================= TOGGLE MENU AVAILABILITY =================
@router.put("/menu/{menu_id}/availability")
def toggle_menu_availability(
    menu_id: str,
    data: AvailabilityUpdate,
    current_user=Depends(get_current_user)
):
    ensure_admin_or_staff(current_user)

    item = menu_collection.find_one_and_update(
        {"_id": ObjectId(menu_id)},
        {"$set": {"available": data.available}},
        return_document=ReturnDocument.AFTER
    )

    if not item:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return {
        "success": True,
        "available": item["available"]
    }


# ================= WALK-IN ORDER =================
@router.post("/place-order")
def place_walkin_order(
    data: AdminPlaceOrder,
    current_user=Depends(get_current_user)
):
    ensure_admin_or_staff(current_user)

    now = datetime.now(IST)
    order_id = get_next_order_id()

    order = {
        "order_id": order_id,
        "order_type": "walk-in",
        "user_id": None,
        "user_name": "Walk-in Customer",
        "items": data.items,
        "total_amount": data.total_amount,
        "payment_method": "counter",
        "payment_status": "paid",
        "status": "pending",
        "status_history": [
            {"status": "pending", "time": now}
        ],
        "created_at": now,
        "updated_at": now
    }

    orders_collection.insert_one(order)

    return {
        "success": True,
        "message": "Walk-in order placed",
        "order_id": order_id
    }


# ================= USERS LIST =================
@router.get("/users")
def get_users(current_user=Depends(get_current_user)):
    ensure_admin_or_staff(current_user)

    users = []
    for u in users_collection.find({}, {"password": 0}):
        u["_id"] = str(u["_id"])
        users.append(u)

    return users
