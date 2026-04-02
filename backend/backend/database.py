from pymongo import MongoClient, ReturnDocument, ASCENDING, DESCENDING
from datetime import timedelta, timezone, datetime
from dotenv import load_dotenv
import os

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
# CLIENT
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

# =========================
# CONNECTION CHECK
# =========================

try:
    client.admin.command("ping")
    print("✅ MongoDB connected")
except Exception as e:
    raise RuntimeError(f"MongoDB connection failed: {e}")

# =========================
# DATABASE
# =========================

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
# INDEX SETUP
# =========================

def init_indexes():

    # USERS
    users_collection.create_index(
        [("email", ASCENDING)],
        unique=True,
        background=True
    )

    # ORDERS
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

    # ACTIVE ORDERS (admin dashboard optimization)
    orders_collection.create_index(
        [("status", ASCENDING)],
        partialFilterExpression={
            "status": {"$in": ["pending", "paid", "preparing"]}
        },
        background=True
    )

    # MENU
    menu_collection.create_index(
        [("available", ASCENDING)],
        background=True
    )

    # FEEDBACK
    feedback_collection.create_index(
        [("created_at", DESCENDING)],
        background=True
    )

    feedback_collection.create_index(
        [("order_id", ASCENDING)],
        background=True
    )

    # WALLET
    wallet_collection.create_index(
        [("user_id", ASCENDING)],
        unique=True,
        background=True
    )

    # WALLET TRANSACTIONS
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

    # COUNTERS
    counters_collection.create_index(
        [("_id", ASCENDING)],
        unique=True,
        background=True
    )

    # OTP TTL INDEX (auto delete expired OTPs)
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


# run once on startup
init_indexes()

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