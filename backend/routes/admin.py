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


class DeleteUserSchema(BaseModel):
    user_id: str


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


# SECURITY: Admin creation route removed
# Admin accounts can only be created through direct database operations
# or secure backend scripts. No API endpoint should allow admin creation.
# Use the seed_admin.py migration script to create the default admin account.


# ================= UPDATE ORDER STATUS =================

@router.put("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    data: OrderStatusUpdate,
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    status = data.status.lower()

    # NEW 4-STATUS SYSTEM
    allowed_transitions = {
        "confirmed": ["preparing", "ready_for_pickup"],
        "preparing": ["ready_for_pickup"],
        "ready_for_pickup": ["picked_up"],
        "picked_up": [],
    }

    # Validate status is one of the 4 allowed statuses
    valid_statuses = ["confirmed", "preparing", "ready_for_pickup", "picked_up"]
    if status not in valid_statuses:
        raise HTTPException(400, f"Invalid status. Must be one of: {', '.join(valid_statuses)}")

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

    try:
        ensure_admin(current_user)

        if not data.items:
            raise HTTPException(400, "Order must contain items")

        if data.total_amount <= 0:
            raise HTTPException(400, "Invalid total amount")

        for item in data.items:
            if item.quantity <= 0 or item.price <= 0:
                raise HTTPException(400, "Invalid item data")

        now = datetime.now(IST)

        # PERFORMANCE: Parallel operations - generate order ID and prepare data simultaneously
        order_id, order_code = next_walkin_order()

        # PERFORMANCE: Prepare order document with all required fields
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
            "status": "confirmed",
            "status_history": [{"status": "confirmed", "time": now}],
            "created_at": now,
            "updated_at": now,
        }

        # PERFORMANCE: Single database insert for order
        result = orders_collection.insert_one(order)
        order["_id"] = str(result.inserted_id)

        # PERFORMANCE: Parallel async operations for non-critical tasks
        # These run in background without blocking response
        async def background_tasks():
            try:
                # Insert status history
                order_status_history_collection.insert_one({
                    "order_id": order_id,
                    "status": "confirmed",
                    "updated_by": str(current_user["_id"]),
                    "timestamp": now
                })
                
                # Broadcast to WebSocket
                await manager.broadcast({
                    "type": "new_order",
                    "order": serialize_order(order)
                })
                
                # Audit logging
                log_audit("place_walkin_order", user_id=current_user.get("_id"), details={"order_id": order_id, "total": data.total_amount})
            except Exception as e:
                logger.error(f"Background task failed for order {order_id}: {e}")

        # Start background tasks without awaiting
        import asyncio
        asyncio.create_task(background_tasks())

        return {
            "success": True,
            "order_id": order_id,
            "order_code": order_code,
            "status": "confirmed",
            "order": serialize_order(order),
            "slip_generated": True,  # Indicate slip generation is handled
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Walk-in order creation failed: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(
            status_code=500,
            detail=f"Walk-in order creation failed: {str(e)}"
        )


# ================= USERS LIST =================

@router.get("/users")
def get_all_users(current_user=Depends(get_current_user)):
    ensure_admin(current_user)
    
    users = list(users_collection.find({"deleted_at": {"$exists": False}}).sort("created_at", -1))
    
    result = []
    for u in users:
        # Get wallet balance
        wallet = wallet_collection.find_one({"user_id": u["_id"]})
        balance = wallet["balance"] if wallet else 0
        
        # Get order count
        order_count = orders_collection.count_documents({"user_id": u["_id"]})
        
        result.append({
            "_id": str(u["_id"]),
            "name": u.get("name"),
            "email": u.get("email"),
            "role": u.get("role"),
            "wallet_balance": balance,
            "order_count": order_count,
            "created_at": u.get("created_at"),
        })
    
    return {"users": result}


# ================= DELETE USER =================

@router.delete("/users/{user_id}")
def delete_user(user_id: str, current_user=Depends(get_current_user)):
    ensure_admin(current_user)
    
    if not ObjectId.is_valid(user_id):
        raise HTTPException(400, "Invalid user ID")
    
    user_obj_id = ObjectId(user_id)
    
    # Check if user exists
    user = users_collection.find_one({"_id": user_obj_id})
    if not user:
        raise HTTPException(404, "User not found")
    
    # Prevent deleting admins
    if user.get("role") == "admin":
        raise HTTPException(403, "Cannot delete admin users")
    
    # Check if user has orders or wallet transactions
    order_count = orders_collection.count_documents({"user_id": user_obj_id})
    wallet_txn_count = wallet_txn_collection.count_documents({"user_id": user_obj_id})
    
    # Soft delete: mark as deleted but preserve history
    now = datetime.now(IST)
    users_collection.update_one(
        {"_id": user_obj_id},
        {
            "$set": {
                "deleted_at": now,
                "deleted_by": ObjectId(current_user["_id"]),
                "deleted_reason": "admin_deletion"
            }
        }
    )
    
    # Log audit
    log_audit(
        "delete_user",
        user_id=current_user.get("_id"),
        details={
            "deleted_user_id": user_id,
            "deleted_user_name": user.get("name"),
            "deleted_user_email": user.get("email"),
            "order_count": order_count,
            "wallet_txn_count": wallet_txn_count
        }
    )
    
    return {
        "success": True,
        "message": "User deleted successfully",
        "preserved_orders": order_count,
        "preserved_wallet_transactions": wallet_txn_count
    }


# ================= USERS LIST (LEGACY - FOR COMPATIBILITY) =================

@router.get("/users/list")
def get_users(
    limit: int = Query(200, le=500),
    current_user=Depends(get_current_user)
):

    ensure_admin(current_user)

    users_cursor = list(
        users_collection.find(
            {"deleted_at": {"$exists": False}},
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