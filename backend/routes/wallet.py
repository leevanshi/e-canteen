from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel, Field
from pymongo import ReturnDocument

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/wallet", tags=["Wallet"])

from database import wallet_collection, wallet_txn_collection
from routes.auth import get_current_user


# ================= SCHEMA =================

class AdminAddMoney(BaseModel):
    user_id: str
    amount: int = Field(..., gt=0, le=10000)  
    # integer avoids float precision issues


# ================= GET MY WALLET =================

@router.get("/me")
def get_my_wallet(current_user=Depends(get_current_user)):

    wallet = wallet_collection.find_one({
        "user_id": ObjectId(current_user["_id"])
    })

    if not wallet:
        return {
            "balance": 0
        }

    return {
        "balance": int(wallet.get("balance", 0))
    }


# ================= ADMIN ADD MONEY =================

@router.post("/admin/add-money")
def admin_add_money(
    data: AdminAddMoney,
    current_user=Depends(get_current_user)
):

    # ---- role guard ----
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    # ---- validate user id ----
    if not ObjectId.is_valid(data.user_id):
        raise HTTPException(400, "Invalid user ID")

    user_obj_id = ObjectId(data.user_id)

    now = datetime.now(IST)

    # ================= ATOMIC WALLET UPDATE =================

    wallet = wallet_collection.find_one_and_update(
        {"user_id": user_obj_id},
        {
            "$inc": {"balance": data.amount},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "user_id": user_obj_id,
                "created_at": now
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    new_balance = int(wallet.get("balance", 0))

    # ================= TRANSACTION LOG =================

    wallet_txn_collection.insert_one({
        "user_id": user_obj_id,
        "amount": data.amount,
        "type": "credit",
        "source": "admin",
        "admin_id": ObjectId(current_user["_id"]),
        "reference": "manual_admin_credit",
        "balance_after": new_balance,
        "created_at": now
    })

    return {
        "message": "Wallet credited successfully",
        "user_id": data.user_id,
        "amount_added": data.amount,
        "new_balance": new_balance
    }