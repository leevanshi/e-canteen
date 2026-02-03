from enum import Enum
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timedelta, timezone
from typing import List

from auth import get_current_user
from database import orders_collection

router = APIRouter(
    prefix="/api/orders",
    tags=["Orders"]
)

IST = timezone(timedelta(hours=5, minutes=30))

# =========================
# ENUMS & SCHEMAS
# =========================

class OrderStatus(str, Enum):
    pending = "pending"
    preparing = "preparing"
    completed = "completed"

class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# =========================
# GET ALL ONLINE ORDERS (ADMIN / STAFF)
# =========================

@router.get("/")
def get_all_orders(current_user=Depends(get_current_user)):
    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    orders = list(
        orders_collection.find(
            {"order_type": "online"}
        ).sort("created_at", -1)
    )

    for order in orders:
        order["_id"] = str(order["_id"])
        order["user_id"] = str(order.get("user_id"))

    return orders


# =========================
# UPDATE ORDER STATUS
# =========================

@router.put("/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):
    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        oid = ObjectId(order_id)
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid order id")

    order = orders_collection.find_one(
        {"_id": oid, "order_type": "online"}
    )

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    now = datetime.now(IST)

    orders_collection.update_one(
        {"_id": oid},
        {
            "$set": {
                "status": data.status.value,
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": data.status.value,
                    "time": now
                }
            }
        }
    )

    return {
        "success": True,
        "order_id": order_id,
        "status": data.status.value
    }
