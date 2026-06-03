from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional
from pymongo import ReturnDocument
from collections import defaultdict
import time
from email_service import send_order_email, send_admin_notification
from database import (
    orders_collection,
    wallet_collection,
    wallet_txn_collection,
    menu_collection,
    counters_collection,
    client
)

from routes.auth import get_current_user
from server import manager

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/orders", tags=["Orders"])


# ================= ORDER RATE LIMIT =================

order_attempts = defaultdict(list)
ORDER_LIMIT = 5
ORDER_WINDOW = 10


# ================= ORDER COUNTER =================

def get_next_order_id(session=None):

    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {"$inc": {"seq": 1}, "$setOnInsert": {"seq": 99}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
        session=session
    )

    return counter["seq"]


# ================= SCHEMAS =================

class OrderItem(BaseModel):
    item_id: str
    quantity: int


class CreateOrder(BaseModel):
    items: List[OrderItem]
    pickup_time: Optional[str] = None
    payment_method: str


class AddMoneyRequest(BaseModel):
    user_id: str
    amount: int


# ================= PLACE ORDER =================

@router.post("/")
async def place_order(data: CreateOrder, current_user=Depends(get_current_user)):

    now = datetime.now(IST)

    user_id = current_user["_id"]

    # ===== RATE LIMIT =====

    now_ts = time.time()

    order_attempts[user_id] = [
        t for t in order_attempts[user_id]
        if now_ts - t < ORDER_WINDOW
    ]

    if len(order_attempts[user_id]) >= ORDER_LIMIT:
        raise HTTPException(
            429,
            "Too many order attempts. Please wait."
        )

    order_attempts[user_id].append(now_ts)

    if data.payment_method not in ["wallet", "counter"]:
        raise HTTPException(400, "Invalid payment method")

    if not data.items:
        raise HTTPException(400, "Order items required")

    total = 0
    clean_items = []

    for item in data.items:

        if item.quantity <= 0:
            raise HTTPException(400, "Invalid quantity")

        if not ObjectId.is_valid(item.item_id):
            raise HTTPException(400, "Invalid menu item ID")

        menu_item = menu_collection.find_one({
            "_id": ObjectId(item.item_id),
            "available": True
        })

        if not menu_item:
            raise HTTPException(400, "Menu item unavailable")

        if menu_item["price"] <= 0:
            raise HTTPException(400, "Invalid menu price")

        item_total = menu_item["price"] * item.quantity
        total += item_total

        clean_items.append({
            "item_id": str(menu_item["_id"]),
            "name": menu_item["name"],
            "price": menu_item["price"],
            "quantity": item.quantity
        })

    payment_status = "paid" if data.payment_method == "wallet" else "pending"

    with client.start_session() as session:
        with session.start_transaction():

            order_id = get_next_order_id(session)

            if data.payment_method == "wallet":

                wallet = wallet_collection.find_one_and_update(
                    {
                        "user_id": ObjectId(user_id),
                        "balance": {"$gte": total}
                    },
                    {
                        "$inc": {"balance": -total},
                        "$set": {"updated_at": now}
                    },
                    return_document=ReturnDocument.AFTER,
                    session=session
                )

                if not wallet:
                    raise HTTPException(400, "Insufficient wallet balance")

                wallet_txn_collection.insert_one({
                    "user_id": ObjectId(user_id),
                    "amount": total,
                    "type": "debit",
                    "source": "order",
                    "order_id": order_id,
                    "balance_after": wallet["balance"],
                    "created_at": now
                }, session=session)

            order_doc = {
                "order_id": order_id,
                "order_type": "online",
                "user_id": ObjectId(user_id),
                "user_name": current_user["name"],
                "user_email": current_user["email"],
                "items": clean_items,
                "total_amount": total,
                "pickup_time": data.pickup_time,
                "payment_method": data.payment_method,
                "payment_status": payment_status,
                "status": "pending",
                "status_history": [{"status": "pending", "time": now}],
                "created_at": now,
                "updated_at": now
            }


            result = orders_collection.insert_one(order_doc, session=session)

    # ===== AFTER SUCCESS =====
    order_doc["_id"] = str(result.inserted_id)

    # ================= SEND EMAIL =================
    try:
        order_details = "\n".join([
            f"{item['name']} x {item['quantity']} = ₹{item['price'] * item['quantity']}"
            for item in order_doc["items"]
        ])

        await send_order_email(
            email=current_user["email"],
            order_details=order_details,
            order_id=str(order_doc["order_id"])
        )

        await send_admin_notification(
            subject=f"New order placed - #{order_doc['order_id']}",
            body=(
                f"New order #{order_doc['order_id']} was placed by {order_doc['user_name']}\n"
                f"Email: {order_doc['user_email']}\n\n"
                f"Order details:\n{order_details}"
            )
        )

    except Exception as e:
        print("Email sending failed:", e)

    # ================= BROADCAST =================
    await manager.broadcast({
        "type": "new_order",
        "order": {
            "_id": order_doc["_id"],
            "order_id": order_doc["order_id"],
            "user_name": order_doc["user_name"],
            "items": order_doc["items"],
            "total_amount": order_doc["total_amount"],
            "status": order_doc["status"],
            "created_at": order_doc["created_at"].isoformat()
        }
    })

    return {
        "message": "Order placed successfully",
        "order_id": order_doc["order_id"]
    }
# ================= GET MY ORDERS =================

@router.get("/")
def get_my_orders(current_user=Depends(get_current_user)):

    orders = orders_collection.find(
        {"user_id": ObjectId(current_user["_id"])},
        {"items": 0}
    ).sort("created_at", -1).limit(50)

    result = []

    for o in orders:
        created = o.get("created_at")

        result.append({
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "created_at": created.isoformat() if created else None
        })

    return result


# ================= ADMIN GET ALL ORDERS =================

@router.get("/admin/all")
def get_all_orders(current_user=Depends(get_current_user)):

    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    orders = orders_collection.find().sort("created_at", -1).limit(100)

    result = []

    for o in orders:
        created = o.get("created_at")

        result.append({
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "user_name": o.get("user_name"),
            "items": o.get("items"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "created_at": created.isoformat() if created else None
        })

    return result


# ================= ADMIN UPDATE ORDER STATUS =================

@router.put("/admin/{id}/status")
async def update_status(id: str, data: dict, current_user=Depends(get_current_user)):

    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Invalid order id")

    status = data.get("status")

    allowed_transitions = {
        "pending": ["preparing"],
        "preparing": ["completed"],
        "completed": []
    }

    order = orders_collection.find_one({"_id": ObjectId(id)})

    if not order:
        raise HTTPException(404, "Order not found")

    current_status = order["status"]

    if status not in allowed_transitions.get(current_status, []):
        raise HTTPException(400, "Invalid status transition")

    now = datetime.now(IST)

    order = orders_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {
            "$set": {"status": status, "updated_at": now},
            "$push": {"status_history": {"status": status, "time": now}}
        },
        return_document=ReturnDocument.AFTER
    )

    await manager.broadcast({
        "type": "order_status_update",
        "order_id": order["order_id"],
        "status": status
    })

    return {"message": "Status updated", "status": status}


# ================= ADMIN ADD MONEY =================

@router.post("/admin/add-money")
def admin_add_money(data: AddMoneyRequest, current_user=Depends(get_current_user)):

    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    if data.amount <= 0:
        raise HTTPException(400, "Amount must be positive")

    now = datetime.now(IST)

    wallet = wallet_collection.find_one_and_update(
        {"user_id": ObjectId(data.user_id)},
        {
            "$inc": {"balance": data.amount},
            "$set": {"updated_at": now}
        },
        return_document=ReturnDocument.AFTER
    )

    if not wallet:
        raise HTTPException(404, "Wallet not found")

    wallet_txn_collection.insert_one({
        "user_id": ObjectId(data.user_id),
        "amount": data.amount,
        "type": "credit",
        "source": "admin",
        "balance_after": wallet["balance"],
        "created_at": now
    })

    return {"message": "Money added", "balance": wallet["balance"]}
