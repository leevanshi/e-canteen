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
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=10000,
    retryWrites=True,
    tls=True,
    maxPoolSize=50,
    minPoolSize=5,
    uuidRepresentation="standard"
)

# 🔥 Check connection
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
# INDEXES
# =========================

# USERS
users_collection.create_index("email", unique=True)

# ORDERS
orders_collection.create_index("order_id", unique=True)
orders_collection.create_index("user_id")
orders_collection.create_index("created_at")
orders_collection.create_index("status")
orders_collection.create_index("order_type")

# compound index for dashboard queries
orders_collection.create_index([
    ("created_at", -1),
    ("status", 1)
])

# MENU
menu_collection.create_index("available")

# FEEDBACK
feedback_collection.create_index("created_at")
feedback_collection.create_index("order_id")

# WALLET
wallet_collection.create_index("user_id", unique=True)

# WALLET TRANSACTIONS
wallet_txn_collection.create_index("user_id")
wallet_txn_collection.create_index("created_at")

# COUNTERS
counters_collection.create_index("_id", unique=True)

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