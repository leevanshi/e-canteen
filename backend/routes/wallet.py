from services.wallet_service import credit_wallet
from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field

from database import (
    wallet_collection,
    wallet_txn_collection,
    users_collection
)

from routes.auth import get_current_user


IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/wallet", tags=["Wallet"])


# ================= SCHEMA =================

class AdminAddMoney(BaseModel):
    user_id: str
    amount: int = Field(..., gt=0, le=10000)


# ================= GET MY WALLET =================

@router.get("/me")
def get_my_wallet(current_user=Depends(get_current_user)):

    wallet = wallet_collection.find_one({
        "user_id": ObjectId(current_user["_id"])
    })

    if not wallet:
        return {"balance": 0}

    return {"balance": int(wallet.get("balance", 0))}


# ================= ADMIN ADD MONEY =================

@router.post("/admin/add-money")
def admin_add_money(
    data: AdminAddMoney,
    current_user=Depends(get_current_user)
):

    # ROLE CHECK
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    # USER ID VALIDATION
    if not ObjectId.is_valid(data.user_id):
        raise HTTPException(400, "Invalid user ID")

    user_obj_id = ObjectId(data.user_id)

    # CHECK USER EXISTS
    user = users_collection.find_one({"_id": user_obj_id})

    if not user:
        raise HTTPException(404, "User not found")

    # USE WALLET SERVICE (now handles IST timezone internally)
    new_balance = credit_wallet(
        data.user_id,
        data.amount,
        current_user["_id"],
        description=f"Wallet top-up by {current_user.get('name', 'Admin')}"
    )

    return {
        "message": "Wallet credited successfully",
        "user_id": data.user_id,
        "amount_added": data.amount,
        "new_balance": new_balance
    }


# ================= WALLET HISTORY =================

@router.get("/admin/wallet-history")
def get_wallet_history(current_user=Depends(get_current_user)):
    print("=" * 50)
    print("FETCHING WALLET HISTORY")
    print(f"User ID: {current_user.get('_id')}")
    print(f"User Role: {current_user.get('role')}")
    print("=" * 50)
    
    # ROLE CHECK
    if current_user.get("role") != "admin":
        print("ACCESS DENIED: User is not admin")
        raise HTTPException(403, "Admin only")

    # FETCH ALL TRANSACTIONS, SORTED NEWEST FIRST
    print("Fetching transactions from database...")
    transactions = list(
        wallet_txn_collection.find()
        .sort("created_at", -1)
        .limit(100)
    )
    
    print(f"FOUND {len(transactions)} TRANSACTIONS")

    # FORMAT RESPONSE
    result = []
    for txn in transactions:
        try:
            user = users_collection.find_one({"_id": ObjectId(txn["user_id"])})
            result.append({
                "_id": str(txn["_id"]),
                "user_id": txn["user_id"],
                "user_name": user.get("name", "Unknown") if user else "Unknown",
                "user_email": user.get("email", "") if user else "",
                "amount": txn["amount"],
                "type": txn["type"],
                "description": txn.get("description", ""),
                "order_id": txn.get("order_id"),
                "previous_balance": txn.get("previous_balance"),
                "new_balance": txn.get("new_balance"),
                "admin_name": txn.get("admin_name"),
                "created_at": txn.get("created_at"),
            })
        except Exception as e:
            print(f"ERROR PROCESSING TRANSACTION {txn.get('_id')}: {e}")

    print(f"RETURNING {len(result)} FORMATTED TRANSACTIONS")
    print("=" * 50)
    
    return result


# ================= WALLET ANALYTICS =================

@router.get("/admin/analytics")
def get_wallet_analytics(current_user=Depends(get_current_user)):
    """Get wallet analytics for admin dashboard"""
    
    # ROLE CHECK
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    now = datetime.now(IST)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Users credited today
    today_credits = list(
        wallet_txn_collection.find({
            "type": "credit",
            "created_at": {"$gte": today_start}
        })
    )
    
    unique_users_today = len(set(txn["user_id"] for txn in today_credits))
    
    # Today's total credits
    today_total = sum(txn["amount"] for txn in today_credits)
    
    # This month's total credits
    month_credits = list(
        wallet_txn_collection.find({
            "type": "credit",
            "created_at": {"$gte": month_start}
        })
    )
    
    month_total = sum(txn["amount"] for txn in month_credits)
    
    # Users credited today details
    users_credited_today = []
    for user_id in set(txn["user_id"] for txn in today_credits):
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        user_txns = [txn for txn in today_credits if txn["user_id"] == user_id]
        total_credited = sum(txn["amount"] for txn in user_txns)
        latest_txn = max(user_txns, key=lambda x: x.get("created_at", ""))
        
        users_credited_today.append({
            "user_id": user_id,
            "user_name": user.get("name", "Unknown") if user else "Unknown",
            "user_email": user.get("email", "") if user else "",
            "amount_credited": total_credited,
            "credited_at": latest_txn.get("created_at"),
            "admin_name": latest_txn.get("admin_name", "Admin")
        })
    
    return {
        "users_credited_today": unique_users_today,
        "today_credits": today_total,
        "month_credits": month_total,
        "users_credited_today_details": users_credited_today
    }