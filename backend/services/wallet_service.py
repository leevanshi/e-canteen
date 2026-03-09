from bson import ObjectId
from datetime import datetime
from pymongo import ReturnDocument

from database import wallet_collection, wallet_txn_collection

def credit_wallet(user_id, amount, admin_id, now):

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

    wallet_txn_collection.insert_one({
        "user_id": ObjectId(user_id),
        "amount": amount,
        "type": "credit",
        "source": "admin",
        "admin_id": ObjectId(admin_id),
        "balance_after": new_balance,
        "created_at": now
    })

    return new_balance