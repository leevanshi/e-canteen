from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, field_validator
from typing import List, Optional
from pymongo import ReturnDocument
from collections import defaultdict
from enum import Enum
import time
from email_service import send_order_email, send_admin_notification
from database import (
    orders_collection,
    wallet_collection,
    wallet_txn_collection,
    menu_collection,
    client,
    order_status_history_collection,
)
from services.order_id_service import next_online_order, format_order_code
from services.dashboard_service import get_admin_dashboard_stats

from routes.auth import get_current_user
from server import manager

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/orders", tags=["Orders"])


# ================= HELPERS =================

def serialize_order(o):
    """Serialize order document for JSON response"""
    try:
        created = o.get("created_at")
        
        return {
            "_id": str(o["_id"]),
            "order_id": o.get("order_id"),
            "order_code": format_order_code(o),
            "user_name": o.get("user_name"),
            "user_email": o.get("user_email"),
            "order_type": o.get("order_type"),
            "payment_method": o.get("payment_method"),
            "payment_status": o.get("payment_status"),
            "items": o.get("items", []),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "pickup_time": o.get("pickup_time"),
            "created_at": created.isoformat() if created else None,
            "updated_at": o.get("updated_at").isoformat() if o.get("updated_at") else None,
        }
    except Exception as e:
        print(f"Error serializing order: {str(e)}")
        raise


# ================= ORDER STATUS ENUM =================

class OrderStatus(str, Enum):
    CONFIRMED = "confirmed"
    PREPARING = "preparing"
    READY_FOR_PICKUP = "ready_for_pickup"
    PICKED_UP = "picked_up"

    @classmethod
    def valid_statuses(cls):
        return [status.value for status in cls]

    @classmethod
    def get_allowed_transitions(cls):
        return {
            OrderStatus.CONFIRMED: [OrderStatus.PREPARING, OrderStatus.READY_FOR_PICKUP],
            OrderStatus.PREPARING: [OrderStatus.READY_FOR_PICKUP],
            OrderStatus.READY_FOR_PICKUP: [OrderStatus.PICKED_UP],
            OrderStatus.PICKED_UP: [],
        }


# ================= ORDER RATE LIMIT =================

order_attempts = defaultdict(list)
ORDER_LIMIT = 5
ORDER_WINDOW = 10


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


class UpdateOrderStatus(BaseModel):
    status: str


# ================= PLACE ORDER =================

@router.post("")
async def place_order(data: CreateOrder, current_user=Depends(get_current_user)):

    try:
        now = datetime.now(IST)

        user_id = current_user["_id"]

        print("=" * 50)
        print("ORDER REQUEST RECEIVED")
        print("Received order:", data.dict())
        print(f"User ID: {user_id}")
        print(f"User Name: {current_user.get('name', 'Unknown')}")
        print(f"Items Count: {len(data.items)}")
        print(f"Payment Method: {data.payment_method}")
        print(f"Pickup Time: {data.pickup_time}")
        print("=" * 50)

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

        # ===== VALIDATE WALLET BALANCE BEFORE TRANSACTION =====
        if data.payment_method == "wallet":
            print(f"VALIDATING WALLET BALANCE: User {user_id}, Amount ₹{total}")
            wallet = wallet_collection.find_one({"user_id": ObjectId(user_id)})
            if not wallet:
                print("ERROR: Wallet not found")
                raise HTTPException(400, "Wallet not found")
            if wallet["balance"] < total:
                print(f"ERROR: Insufficient balance. Current: ₹{wallet['balance']}, Required: ₹{total}")
                raise HTTPException(400, "Insufficient wallet balance")
            print(f"WALLET VALIDATION PASSED: Balance ₹{wallet['balance']}")

        # ===== ATOMIC ORDER CREATION =====
        try:
            with client.start_session() as session:
                with session.start_transaction():

                    print("TRANSACTION STARTED")

                    # STEP 1: Generate order ID
                    order_id, order_code = next_online_order(session=session)
                    print(f"ORDER ID GENERATED: {order_id}, Code: {order_code}")

                    # STEP 2: Create order document
                    order_doc = {
                        "order_id": order_id,
                        "order_code": order_code,
                        "order_type": "online",
                        "user_id": ObjectId(user_id),
                        "user_name": current_user["name"],
                        "user_email": current_user["email"],
                        "items": clean_items,
                        "total_amount": total,
                        "pickup_time": data.pickup_time,
                        "payment_method": data.payment_method,
                        "payment_status": payment_status,
                        "status": OrderStatus.CONFIRMED.value,
                        "created_at": now,
                        "updated_at": now
                    }

                    # STEP 3: Insert order
                    result = orders_collection.insert_one(order_doc, session=session)
                    print(f"ORDER INSERTED SUCCESSFULLY: MongoDB ID {result.inserted_id}")
                    print(f"ORDER DETAILS: Total ₹{total}, Status: {OrderStatus.CONFIRMED.value}, Payment: {payment_status}")

                    # STEP 4: Insert status history
                    order_status_history_collection.insert_one({
                        "order_id": order_id,
                        "status": OrderStatus.CONFIRMED.value,
                        "updated_by": str(user_id),
                        "timestamp": now
                    }, session=session)
                    print("STATUS HISTORY INSERTED")

                    # STEP 5: Deduct wallet balance (ONLY AFTER ORDER IS SAVED)
                    if data.payment_method == "wallet":
                        print(f"DEDUCTING WALLET: User {user_id}, Amount ₹{total}")
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
                            print("ERROR: Wallet deduction failed - insufficient balance")
                            raise HTTPException(400, "Insufficient wallet balance during transaction")

                        print(f"WALLET DEDUCTED SUCCESSFULLY: New Balance ₹{wallet['balance']}")

                        # STEP 6: Create wallet transaction record
                        wallet_txn_collection.insert_one({
                            "user_id": ObjectId(user_id),
                            "amount": total,
                            "type": "debit",
                            "source": "order",
                            "order_id": order_id,
                            "description": f"Order payment for {order_code}",
                            "balance_after": wallet["balance"],
                            "created_at": now
                        }, session=session)
                        print("WALLET TRANSACTION RECORDED")

                    print("TRANSACTION COMMITTING")
                    # Transaction commits automatically on success

        except Exception as transaction_error:
            print(f"TRANSACTION FAILED: {str(transaction_error)}")
            print("ROLLING BACK ALL CHANGES")
            raise HTTPException(500, f"Order creation failed: {str(transaction_error)}")

        # ===== AFTER SUCCESS =====
        order_doc["_id"] = str(result.inserted_id)

        print("=" * 50)
        print("ORDER PLACED SUCCESSFULLY")
        print(f"Order ID: {order_doc['order_id']}")
        print(f"Order Code: {order_doc['order_code']}")
        print(f"MongoDB ID: {order_doc['_id']}")
        print("=" * 50)

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
            "success": True,
            "message": "Order placed successfully",
            "order_id": order_doc["order_id"],
            "order_code": order_doc["order_code"],
            "customer_name": order_doc["user_name"],
            "status": order_doc["status"],
            "total_amount": order_doc["total_amount"],
        }

    except HTTPException:
        raise
    except Exception as e:
        print("ORDER ERROR:", str(e))
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


# ================= GET SINGLE ORDER =================

@router.get("/{order_id}")
def get_single_order(order_id: str, current_user=Depends(get_current_user)):
    """Get a single order by order_id or order_code"""
    try:
        print("=" * 50)
        print(f"LOOKING UP ORDER ID: {order_id}")
        print(f"User ID: {current_user.get('_id')}")
        print(f"User Role: {current_user.get('role')}")
        print("=" * 50)
        
        # Try to find by order_id (numeric) or order_code (string like "E-6")
        query = {
            "$or": [
                {"order_id": int(order_id) if order_id.isdigit() else None},
                {"order_code": order_id},
                {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}
            ]
        }
        
        print(f"Query: {query}")
        
        order = orders_collection.find_one(query)
        
        if not order:
            print(f"ORDER NOT FOUND: {order_id}")
            raise HTTPException(404, "Order not found")
        
        print(f"ORDER FOUND: {order.get('order_id')} - {order.get('order_code')}")
        print(f"Order User ID: {order.get('user_id')}")
        
        # Check if user owns this order or is admin
        if (current_user.get("role") != "admin" and
            str(order.get("user_id")) != str(current_user.get("_id"))):
            print("ACCESS DENIED: User does not own this order")
            raise HTTPException(403, "Access denied")
        
        # Convert ObjectId to string
        order["_id"] = str(order["_id"])
        if "user_id" in order and isinstance(order["user_id"], ObjectId):
            order["user_id"] = str(order["user_id"])
        if "admin_id" in order and isinstance(order["admin_id"], ObjectId):
            order["admin_id"] = str(order["admin_id"])
        
        print("SERIALIZING ORDER FOR RESPONSE")
        serialized = serialize_order(order)
        print(f"SERIALIZED ORDER: {serialized.get('order_id')} - {serialized.get('order_code')}")
        
        return serialized

    except HTTPException:
        raise
    except Exception as e:
        print(f"ERROR FETCHING ORDER: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch order: {str(e)}")


# ================= ADMIN DASHBOARD =================

@router.get("/admin/dashboard")
def admin_dashboard(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    return get_admin_dashboard_stats()


# ================= GET MY ORDERS =================

@router.get("")
def get_my_orders(current_user=Depends(get_current_user)):
    try:
        print("=" * 50)
        print(f"FETCHING USER ORDERS")
        print(f"User ID: {current_user.get('_id')}")
        print("=" * 50)
        
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
                "order_code": format_order_code(o),
                "total_amount": o.get("total_amount"),
                "status": o.get("status"),
                "created_at": created.isoformat() if created else None,
            })
        
        print(f"FOUND {len(result)} ORDERS FOR USER")
        
        return result

    except Exception as e:
        print(f"ERROR FETCHING USER ORDERS: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(500, f"Failed to fetch orders: {str(e)}")


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
            "order_code": format_order_code(o),
            "user_name": o.get("user_name"),
            "order_type": o.get("order_type"),
            "items": o.get("items"),
            "total_amount": o.get("total_amount"),
            "status": o.get("status"),
            "status_history": o.get("status_history", []),
            "created_at": created.isoformat() if created else None,
        })

    return result


# ================= ADMIN UPDATE ORDER STATUS =================

@router.put("/{order_id}/status")
async def update_order_status(order_id: str, data: UpdateOrderStatus, current_user=Depends(get_current_user)):
    """Update order status - accessible by admin"""
    
    print("=" * 50)
    print(f"UPDATE ORDER STATUS: {order_id}")
    print(f"New status: {data.status}")
    print(f"User role: {current_user.get('role')}")
    print("=" * 50)
    
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    # Validate status
    valid_statuses = OrderStatus.valid_statuses()
    if data.status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {valid_statuses}")

    # Try to find by order_id (int), order_code (string), or _id (ObjectId)
    query = {
        "$or": [
            {"order_id": int(order_id) if order_id.isdigit() else None},
            {"order_code": order_id},
            {"_id": ObjectId(order_id) if ObjectId.is_valid(order_id) else None}
        ]
    }
    
    order = orders_collection.find_one(query)
    
    if not order:
        print(f"ORDER NOT FOUND: {order_id}")
        raise HTTPException(404, "Order not found")
    
    print(f"ORDER FOUND: {order.get('order_id')} - {order.get('order_code')}")
    print(f"Current status: {order.get('status')}")
    
    now = datetime.now(IST)
    
    # Update order status
    updated_order = orders_collection.find_one_and_update(
        query,
        {
            "$set": {"status": data.status, "updated_at": now},
            "$push": {"status_history": {"status": data.status, "time": now}}
        },
        return_document=ReturnDocument.AFTER
    )
    
    print(f"STATUS UPDATED: {order.get('order_id')} -> {data.status}")
    
    # Broadcast via websocket for real-time updates
    try:
        await manager.broadcast({
            "type": "order_status_update",
            "order_id": updated_order.get("order_id"),
            "order_code": updated_order.get("order_code"),
            "status": data.status
        })
        print("WebSocket broadcast sent")
    except Exception as e:
        print(f"WebSocket broadcast failed: {e}")
    
    return {
        "message": "Status updated successfully",
        "order_id": updated_order.get("order_id"),
        "order_code": updated_order.get("order_code"),
        "status": data.status
    }


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
