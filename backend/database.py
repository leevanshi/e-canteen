from pymongo import MongoClient, ReturnDocument
from datetime import timedelta, timezone
import os
from dotenv import load_dotenv

# =========================
# LOAD ENV (🔥 MUST BE FIRST)
# =========================
load_dotenv()

# =========================
# ENV VARIABLES
# =========================
MONGO_URL = os.getenv("MONGO_URL")
DB_NAME = os.getenv("DB_NAME", "ecanteen")

if not MONGO_URL:
    raise RuntimeError("MONGO_URL not set")

# =========================
# TIMEZONE
# =========================
IST = timezone(timedelta(hours=5, minutes=30))

# =========================
# MONGODB CLIENT (FAIL FAST)
# =========================
client = MongoClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000,
)

# 🔥 Force MongoDB connection at startup
try:
    client.server_info()
except Exception as e:
    raise RuntimeError(f"MongoDB connection failed: {e}")

db = client[DB_NAME]

# =========================
# COLLECTIONS
# =========================
users_collection = db["users"]
orders_collection = db["orders"]
menu_collection = db["menu"]
feedback_collection = db["feedback"]
wallet_collection = db["wallets"]
wallet_txn_collection = db["wallet_transactions"]
counters_collection = db["counters"]

# =========================
# ORDER ID COUNTER
# =========================
def get_next_order_id() -> int:
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
