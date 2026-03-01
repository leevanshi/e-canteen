from pymongo import MongoClient, ReturnDocument
from datetime import timedelta, timezone, datetime
import os
from dotenv import load_dotenv

# =========================
# LOAD ENV
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

def now_ist():
    return datetime.now(IST)

# =========================
# MONGODB CLIENT
# =========================
client = MongoClient(
    MONGO_URL,
    serverSelectionTimeoutMS=5000,
    connectTimeoutMS=5000,
    socketTimeoutMS=5000,
    retryWrites=True,
    uuidRepresentation="standard"
)

# 🔥 Check connection at startup
try:
    client.admin.command("ping")
    print("✅ MongoDB connected successfully")
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
# INDEXES (VERY IMPORTANT)
# =========================
users_collection.create_index("email", unique=True)
orders_collection.create_index("order_id", unique=True)
wallet_collection.create_index("user_id")

# =========================
# ORDER ID COUNTER
# =========================
def get_next_order_id() -> int:
    counter = counters_collection.find_one_and_update(
        {"_id": "order_id"},
        {
            "$inc": {"seq": 1},
            "$setOnInsert": {"seq": 99}
        },
        upsert=True,
        return_document=ReturnDocument.AFTER
    )

    return counter["seq"]