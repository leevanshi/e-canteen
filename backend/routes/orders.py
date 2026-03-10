from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import List, Optional
from pymongo import ReturnDocument

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/orders", tags=["Orders"])

from database import (
    orders_collection,
    wallet_collection,
    wallet_txn_collection,
    menu_collection,
    counters_collection,
    client
)

from routes.auth import get_current_user
from main import manager


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
                "Menu item unavailable"
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

    order_doc = None
    result = None

    with client.start_session() as session:

        with session.start_transaction():

            order_id = get_next_order_id(session)

            # WALLET PAYMENT
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
                    return_document=ReturnDocument.AFTER,
                    session=session
                )

                if not wallet:
                    raise HTTPException(
                        400,
                        "Insufficient wallet balance"
                    )

                new_balance = wallet["balance"]

                wallet_txn_collection.insert_one({
                    "user_id": ObjectId(current_user["_id"]),
                    "amount": total,
                    "type": "debit",
                    "source": "order",
                    "order_id": order_id,
                    "balance_after": new_balance,
                    "created_at": now
                }, session=session)

            # CREATE ORDER
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
                "status_history": [{"status": "pending", "time": now}],
                "created_at": now,
                "updated_at": now
            }

            result = orders_collection.insert_one(order_doc, session=session)

    order_doc["_id"] = str(result.inserted_id)

    # ================= REALTIME PUSH =================

    await manager.broadcast({
        "type": "new_order",
        "order": {
            "_id": order_doc["_id"],
            "order_id": order_doc["order_id"],
            "order_type": order_doc["order_type"],
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

    orders = orders_collection.find({
        "user_id": ObjectId(current_user["_id"])
    }).sort("created_at", -1)

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
def get_all_orders():

    orders = orders_collection.find().sort("created_at", -1)

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
def update_status(id: str, data: dict):

    if not ObjectId.is_valid(id):
        raise HTTPException(400, "Invalid order id")

    status = data.get("status")

    if status not in ["pending", "preparing", "completed"]:
        raise HTTPException(400, "Invalid status")

    now = datetime.now(IST)

    order = orders_collection.find_one_and_update(
        {"_id": ObjectId(id)},
        {
            "$set": {
                "status": status,
                "updated_at": now
            },
            "$push": {
                "status_history": {
                    "status": status,
                    "time": now
                }
            }
        },
        return_document=ReturnDocument.AFTER
    )

    if not order:
        raise HTTPException(404, "Order not found")

    return {"message": "Status updated", "status": status}
# ================= ADMIN ADD MONEY =================

@router.post("/admin/add-money")
def admin_add_money(data: AddMoneyRequest):

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

    return {
        "message": "Money added",
        "balance": wallet["balance"]
    }
# ================= ADMIN WALLET HISTORY =================

@router.get("/admin/wallet-history")
def wallet_history():

    txns = wallet_txn_collection.find().sort("created_at", -1)

    result = []

    for t in txns:

        created = t.get("created_at")

        result.append({
            "_id": str(t["_id"]),
            "user_id": str(t.get("user_id")),
            "amount": t.get("amount"),
            "type": t.get("type"),
            "source": t.get("source"),
            "balance_after": t.get("balance_after"),
            "created_at": created.isoformat() if created else None
        })

    return result