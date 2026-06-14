from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument

from database import wallet_collection, wallet_txn_collection, users_collection

def credit_wallet(user_id, amount, admin_id, now, description="Wallet top-up by admin"):

    # Get current balance before transaction
    wallet = wallet_collection.find_one({"user_id": ObjectId(user_id)})
    previous_balance = wallet["balance"] if wallet else 0

    # Update wallet balance
    wallet = wallet_collection.find_one_and_update(
        {"user_id": ObjectId(user_id)},
        {
            "$inc": {"balance": amount},
            "$set": {"updated_at": now},
            "$setOnInsert": {
                "user_id": ObjectId(user_id),
                "created_at": now
            }
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    new_balance = wallet["balance"]

    # Get admin name
    admin = users_collection.find_one({"_id": ObjectId(admin_id)})
    admin_name = admin.get("name", "Admin") if admin else "Admin"

    # Create transaction history entry
    wallet_txn_collection.insert_one({
        "user_id": ObjectId(user_id),
        "amount": amount,
        "type": "credit",
        "source": "admin",
        "admin_id": ObjectId(admin_id),
        "admin_name": admin_name,
        "description": description,
        "previous_balance": previous_balance,
        "new_balance": new_balance,
        "balance_after": new_balance,
        "created_at": now
    })

    return new_balance


def debit_wallet(user_id, amount, order_id, now, description="Order payment"):

    # Get current balance before transaction
    wallet = wallet_collection.find_one({"user_id": ObjectId(user_id)})
    if not wallet:
        raise Exception("Wallet not found")
    
    previous_balance = wallet["balance"]

    # Update wallet balance
    wallet = wallet_collection.find_one_and_update(
        {"user_id": ObjectId(user_id)},
        {
            "$inc": {"balance": -amount},
            "$set": {"updated_at": now}
        },
        return_document=ReturnDocument.AFTER
    )

    if not wallet:
        raise Exception("Wallet not found")

    if wallet["balance"] < 0:
        raise Exception("Insufficient balance")

    new_balance = wallet["balance"]

    # Create transaction history entry
    wallet_txn_collection.insert_one({
        "user_id": ObjectId(user_id),
        "amount": amount,
        "type": "debit",
        "source": "order",
        "order_id": order_id,
        "description": description,
        "previous_balance": previous_balance,
        "new_balance": new_balance,
        "balance_after": new_balance,
        "created_at": now
    })

    return new_balance