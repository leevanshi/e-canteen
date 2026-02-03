from pymongo import MongoClient, ReturnDocument
from datetime import timedelta, timezone
import os
import certifi

MONGO_URL = os.getenv("MONGO_URI")
if not MONGO_URL:
    raise RuntimeError("MONGO_URI not set")

IST = timezone(timedelta(hours=5, minutes=30))

client = MongoClient(
    MONGO_URL,
    tls=True,
    tlsCAFile=certifi.where(),
    tlsAllowInvalidCertificates=True,   # 🔥 THIS LINE FIXES ATLAS TLS
    serverSelectionTimeoutMS=5000
)

db = client["ecanteen"]


users_collection = db["users"]
orders_collection = db["orders"]
menu_collection = db["menu"]
feedback_collection = db["feedback"]
wallet_collection = db["wallets"]
wallet_txn_collection = db["wallet_transactions"]

counters_collection = db["counters"]

# ✅ ONLY COUNTER LOGIC (ONE PLACE)
def get_next_order_id():
    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {
            "$inc": {"seq": 1},
            "$setOnInsert": {"seq": 100}
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )
    return counter["seq"]
