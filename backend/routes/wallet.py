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

    now = datetime.now(IST)

    # USE WALLET SERVICE
    new_balance = credit_wallet(
        data.user_id,
        data.amount,
        current_user["_id"],
        now,
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
    # ROLE CHECK
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    # FETCH ALL TRANSACTIONS, SORTED NEWEST FIRST
    transactions = list(
        wallet_txn_collection.find()
        .sort("created_at", -1)
        .limit(100)
    )

    # FORMAT RESPONSE
    result = []
    for txn in transactions:
        user = users_collection.find_one({"_id": ObjectId(txn["user_id"])})
        result.append({
            "_id": str(txn["_id"]),
            "user_id": txn["user_id"],
            "user_name": user.get("name", "Unknown") if user else "Unknown",
            "amount": txn["amount"],
            "type": txn["type"],
            "description": txn.get("description", ""),
            "order_id": txn.get("order_id"),
            "created_at": txn.get("created_at"),
        })

    return result