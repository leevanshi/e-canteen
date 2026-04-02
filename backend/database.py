from pymongo import MongoClient, ReturnDocument, ASCENDING, DESCENDING
from datetime import timedelta, timezone, datetime
from dotenv import load_dotenv
import os
import time

# =========================
# LOAD ENV
# =========================

load_dotenv()

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
# CLIENT (NO CONNECTION YET)
# =========================

client = MongoClient(
    MONGO_URL,
    serverSelectionTimeoutMS=10000,
    connectTimeoutMS=10000,
    socketTimeoutMS=20000,
    retryWrites=True,
    maxPoolSize=100,
    minPoolSize=5,
    uuidRepresentation="standard"
)

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
otp_collection = db["otp_verifications"]

# =========================
# CONNECTION CHECK
# =========================

def connect_with_retry(max_retries=5):

    for attempt in range(max_retries):
        try:
            client.admin.command("ping")
            print("✅ MongoDB connected")
            return
        except Exception as e:
            print(f"⚠️ MongoDB connection failed (attempt {attempt+1}): {e}")
            time.sleep(2)

    raise RuntimeError("MongoDB connection failed after retries")

# =========================
# INDEX SETUP
# =========================

def init_indexes():

    users_collection.create_index(
        [("email", ASCENDING)],
        unique=True,
        background=True
    )

    orders_collection.create_index(
        [("order_id", ASCENDING)],
        unique=True,
        background=True
    )

    orders_collection.create_index(
        [("user_id", ASCENDING)],
        background=True
    )

    orders_collection.create_index(
        [("created_at", DESCENDING)],
        background=True
    )

    orders_collection.create_index(
        [("status", ASCENDING), ("created_at", DESCENDING)],
        background=True
    )

    orders_collection.create_index(
        [("order_type", ASCENDING)],
        background=True
    )

    orders_collection.create_index(
        [("status", ASCENDING)],
        partialFilterExpression={
            "status": {"$in": ["pending", "paid", "preparing"]}
        },
        background=True
    )

    menu_collection.create_index(
        [("available", ASCENDING)],
        background=True
    )

    feedback_collection.create_index(
        [("created_at", DESCENDING)],
        background=True
    )

    feedback_collection.create_index(
        [("order_id", ASCENDING)],
        background=True
    )

    wallet_collection.create_index(
        [("user_id", ASCENDING)],
        unique=True,
        background=True
    )

    wallet_txn_collection.create_index(
        [("user_id", ASCENDING), ("created_at", DESCENDING)],
        background=True
    )

    wallet_txn_collection.create_index(
        [("type", ASCENDING)],
        background=True
    )

    wallet_txn_collection.create_index(
        [("source", ASCENDING)],
        background=True
    )

    counters_collection.create_index(
        [("_id", ASCENDING)],
        unique=True,
        background=True
    )

    otp_collection.create_index(
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        background=True
    )

    otp_collection.create_index(
        [("email", ASCENDING)],
        background=True
    )

    print("✅ MongoDB indexes initialized")

# =========================
# ORDER ID GENERATOR
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

# =========================
# CLEAN SHUTDOWN
# =========================

def close_mongo_connection():
    try:
        client.close()
        print("MongoDB connection closed")
    except Exception:
        pass