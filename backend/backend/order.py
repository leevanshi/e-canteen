from enum import Enum
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from bson import ObjectId
from datetime import datetime, timedelta, timezone

# ================= CONFIG =================
IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/api/admin/orders",
    tags=["Admin Orders"]
)

# ================= DATABASE =================
from database import orders_collection

# ================= AUTH =================
from auth import get_current_user

# ================= ENUMS =================
class OrderStatus(str, Enum):
    pending = "pending"
    preparing = "preparing"
    completed = "completed"

class OrderStatusUpdate(BaseModel):
    status: OrderStatus


# ================= GET ALL ONLINE ORDERS =================
@router.get("/")
def get_all_orders(current_user=Depends(get_current_user)):

    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    orders = list(
        orders_collection.find(
            {"order_type": "online"}
        ).sort("created_at", -1)
    )

    formatted_orders = []

    for order in orders:
        order["_id"] = str(order["_id"])
        order["user_id"] = str(order["user_id"]) if order.get("user_id") else None
        formatted_orders.append(order)

    return formatted_orders


# ================= UPDATE ORDER STATUS =================
@router.put("/{order_id}/status")
def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") not in ["admin", "staff"]:
        raise HTTPException(status_code=403, detail="Not authorized")

    # ================= FIND ORDER =================
    query = None
    order = None

    if order_id.isdigit():
        query = {
            "order_id": int(order_id),
            "order_type": "online"
        }
        order = orders_collection.find_one(query)

    else:
        if not ObjectId.is_valid(order_id):
            raise HTTPException(status_code=400, detail="Invalid order id")

        oid = ObjectId(order_id)

        query = {
            "_id": oid,
            "order_type": "online"
        }

        order = orders_collection.find_one(query)

    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    # ================= STATUS VALIDATION =================
    valid_transitions = {
        "pending": ["preparing"],
        "preparing": ["completed"],
        "completed": []
    }

    current_status = order.get("status")

    if current_status not in valid_transitions:
        raise HTTPException(status_code=400, detail="Invalid order state")

    if data.status.value not in valid_transitions[current_status]:
        raise HTTPException(status_code=400, detail="Invalid status transition")

    now = datetime.now(IST)

    # ================= UPDATE ORDER =================
    result = orders_collection.update_one(
        query,
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

    if result.modified_count == 0:
        raise HTTPException(status_code=500, detail="Failed to update order")

    return {
        "success": True,
        "order_id": order.get("order_id") or str(order.get("_id")),
        "new_status": data.status.value,
        "updated_at": now
    }