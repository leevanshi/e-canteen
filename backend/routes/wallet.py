from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from pymongo import ReturnDocument

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/wallet", tags=["Wallet"])

from database import wallet_collection, wallet_txn_collection
from routes.auth import get_current_user


# ================= SCHEMA =================
class AdminAddMoney(BaseModel):
    user_id: str
    amount: float


# ================= GET MY WALLET =================
@router.get("/me")
def get_my_wallet(current_user=Depends(get_current_user)):

    wallet = wallet_collection.find_one(
        {"user_id": ObjectId(current_user["_id"])}
    )

    if not wallet:
        return {"balance": 0}

    return {
        "balance": wallet.get("balance", 0)
    }


# ================= ADMIN ADD MONEY =================
@router.post("/admin/add-money")
def admin_add_money(
    data: AdminAddMoney,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not ObjectId.is_valid(data.user_id):
        raise HTTPException(status_code=400, detail="Invalid user ID")

    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Invalid amount")

    now = datetime.now(IST)

    # ================= UPDATE WALLET =================
    wallet = wallet_collection.find_one_and_update(
        {"user_id": ObjectId(data.user_id)},
        {
            "$inc": {"balance": data.amount},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "user_id": ObjectId(data.user_id),
                "created_at": now
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    new_balance = wallet.get("balance", 0)

    # ================= LOG TRANSACTION =================
    wallet_txn_collection.insert_one({
        "user_id": ObjectId(data.user_id),
        "amount": data.amount,
        "type": "credit",
        "method": "admin",
        "admin_id": ObjectId(current_user["_id"]),
        "balance_after": new_balance,
        "created_at": now
    })

    return {
        "message": "Wallet updated successfully",
        "user_id": data.user_id,
        "balance": new_balance
    }