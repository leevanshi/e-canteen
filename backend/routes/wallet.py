from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/wallet",
    tags=["Wallet"]
)

from database import wallet_collection
from routes.auth import get_current_user


class AdminAddMoney(BaseModel):
    user_id: str
    amount: float


@router.get("/me")
def get_my_wallet(current_user=Depends(get_current_user)):
    wallet = wallet_collection.find_one(
        {"user_id": ObjectId(current_user["_id"])}
    )

    if not wallet:
        return {"balance": 0}

    return {"balance": wallet.get("balance", 0)}


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

    wallet_collection.find_one_and_update(
        {"user_id": ObjectId(data.user_id)},
        {
            "$inc": {"balance": data.amount},
            "$set": {"updated_at": datetime.now(IST)}
        },
        upsert=True
    )

    return {
        "message": "Wallet updated successfully",
        "amount": data.amount
    }