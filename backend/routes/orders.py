from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional
from pymongo import ReturnDocument

# ================= CONFIG =================

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/orders", tags=["Orders"])

# ================= DATABASE =================

from database import (
    orders_collection,
    wallet_collection,
    wallet_txn_collection,
    menu_collection,
    counters_collection
)

# ================= AUTH =================

from routes.auth import get_current_user, require_admin

# ================= WEBSOCKET =================

from main import manager

# ================= COUNTER HELPER =================


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
    item_id: str
    name: str
    price: float
    quantity: int


class CreateOrder(BaseModel):
    items: List[OrderItem]
    pickup_time: Optional[str] = None
    payment_method: str


# ================= PLACE ORDER =================


@router.post("/")
async def place_order(data: CreateOrder, current_user=Depends(get_current_user)):

    now = datetime.now(IST)

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
            raise HTTPException(
                400,
                f"{item.name} is not available"
            )

        item_total = menu_item["price"] * item.quantity
        total += item_total

        clean_items.append({
            "item_id": str(menu_item["_id"]),
            "name": menu_item["name"],
            "price": menu_item["price"],
            "quantity": item.quantity
        })

    payment_status = "paid" if data.payment_method == "wallet" else "pending"

    # ================= WALLET PAYMENT =================

    if data.payment_method == "wallet":

        wallet = wallet_collection.find_one_and_update(
            {
                "user_id": ObjectId(current_user["_id"]),
                "balance": {"$gte": total}
            },
            {
                "$inc": {"balance": -total},
                "$set": {"updated_at": now}
            },
            return_document=ReturnDocument.AFTER
        )

        if not wallet:
            raise HTTPException(
                400,
                "Insufficient wallet balance"
            )

        new_balance = wallet.get("balance", 0)

        # ================= WALLET TRANSACTION =================

        wallet_txn_collection.insert_one({
            "user_id": ObjectId(current_user["_id"]),
            "amount": total,
            "type": "debit",
            "source": "order",
            "order_id": None,  # will update later
            "balance_after": new_balance,
            "created_at": now
        })

    # ================= CREATE ORDER =================

    order_id = get_next_order_id()

    order_doc = {
        "order_id": order_id,
        "order_type": "online",
        "user_id": ObjectId(current_user["_id"]),
        "user_name": current_user["name"],
        "items": clean_items,
        "total_amount": total,
        "pickup_time": data.pickup_time,
        "payment_method": data.payment_method,
        "payment_status": payment_status,
        "status": "pending",
        "status_history": [
            {"status": "pending", "time": now}
        ],
        "created_at": now,
        "updated_at": now
    }

    result = orders_collection.insert_one(order_doc)

    order_doc["_id"] = str(result.inserted_id)

    # update wallet txn with order id
    if data.payment_method == "wallet":
        wallet_txn_collection.update_one(
            {
                "user_id": ObjectId(current_user["_id"]),
                "order_id": None
            },
            {
                "$set": {"order_id": order_id}
            }
        )

    # ================= REALTIME PUSH =================

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
        "order_id": order_id
    }


# ================= GET MY ORDERS =================


@router.get("/")
def get_my_orders(current_user=Depends(get_current_user)):

    orders = orders_collection.find({
        "user_id": ObjectId(current_user["_id"])
    }).sort("created_at", -1)

    result = []

    for o in orders:

        result.append({
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "user_name": o.get("user_name"),
            "order_type": o.get("order_type"),
            "payment_method": o.get("payment_method"),
            "payment_status": o.get("payment_status"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "created_at": o.get("created_at").isoformat()
            if o.get("created_at") else None
        })

    return result


# ================= GET SINGLE ORDER =================


@router.get("/{order_id}")
def get_order(order_id: str, current_user=Depends(get_current_user)):

    if order_id.isdigit():

        order = orders_collection.find_one({
            "order_id": int(order_id),
            "user_id": ObjectId(current_user["_id"])
        })

    else:

        if not ObjectId.is_valid(order_id):
            raise HTTPException(400, "Invalid order ID")

        order = orders_collection.find_one({
            "_id": ObjectId(order_id),
            "user_id": ObjectId(current_user["_id"])
        })

    if not order:
        raise HTTPException(404, "Order not found")

    return {
        "_id": str(order["_id"]),
        "order_id": order.get("order_id"),
        "items": order.get("items"),
        "total_amount": order.get("total_amount"),
        "pickup_time": order.get("pickup_time"),
        "payment_method": order.get("payment_method"),
        "payment_status": order.get("payment_status"),
        "status": order.get("status"),
        "created_at": order.get("created_at").isoformat()
        if order.get("created_at") else None
    }


# ================= ADMIN: GET ALL ORDERS =================


@router.get("/admin/all")
def get_all_orders(admin=Depends(require_admin)):

    orders = orders_collection.find().sort("created_at", -1)

    result = []

    for o in orders:

        result.append({
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "user_name": o.get("user_name"),
            "items": o.get("items", []),
            "payment_method": o.get("payment_method"),
            "payment_status": o.get("payment_status"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "created_at": o.get("created_at").isoformat()
            if o.get("created_at") else None
        })

    return result