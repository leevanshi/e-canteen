import logging
import traceback
from pymongo import MongoClient, ReturnDocument, ASCENDING, DESCENDING
from pymongo.errors import PyMongoError
from datetime import timedelta, timezone, datetime
from dotenv import load_dotenv
from pathlib import Path
import os
import time

logger = logging.getLogger(__name__)

# =========================
# LOAD ENV
# =========================

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(dotenv_path=BASE_DIR / ".env")

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
audit_collection = db["audit_logs"]

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

def normalize_index_spec(index_spec):
    if isinstance(index_spec, dict):
        return tuple(index_spec.items())
    return tuple((key, value) for key, value in index_spec)


def index_options_match(existing, desired_kwargs):
    compare_keys = [
        "unique",
        "expireAfterSeconds",
        "partialFilterExpression",
        "sparse",
        "collation",
    ]

    for key in compare_keys:
        existing_value = existing.get(key)
        desired_value = desired_kwargs.get(key)

        if existing_value != desired_value:
            return False

    return True


def safe_create_index(collection, index_spec, **kwargs):
    try:
        desired_key = normalize_index_spec(index_spec)
        existing_indexes = collection.index_information()

        for existing_name, existing_info in existing_indexes.items():
            existing_key = normalize_index_spec(existing_info.get("key", []))

            if existing_key == desired_key:
                if index_options_match(existing_info, kwargs):
                    logger.info(
                        "Index already exists and matches desired options: %s.%s",
                        collection.name,
                        existing_name,
                    )
                else:
                    logger.warning(
                        "Conflicting existing index for %s %s: %s. Skipping creation.",
                        collection.name,
                        desired_key,
                        existing_info,
                    )
                return existing_name

        index_name = collection.create_index(index_spec, **kwargs)
        logger.info("✅ Index created: %s.%s", collection.name, index_name)
        return index_name

    except PyMongoError as exc:
        logger.exception(
            "⚠️ Skipping index creation for %s %s %s: %s",
            collection.name,
            index_spec,
            kwargs,
            exc,
        )
        return None


def init_indexes():

    safe_create_index(
        users_collection,
        [("email", ASCENDING)],
        unique=True,
        background=True
    )

    safe_create_index(
        orders_collection,
        [("order_id", ASCENDING)],
        unique=True,
        background=True
    )

    safe_create_index(
        orders_collection,
        [("user_id", ASCENDING)],
        background=True
    )

    safe_create_index(
        orders_collection,
        [("created_at", DESCENDING)],
        background=True
    )

    safe_create_index(
        orders_collection,
        [("status", ASCENDING), ("created_at", DESCENDING)],
        background=True
    )

    safe_create_index(
        orders_collection,
        [("order_type", ASCENDING)],
        background=True
    )

    safe_create_index(
        orders_collection,
        [("status", ASCENDING)],
        partialFilterExpression={
            "status": {"$in": ["pending", "paid", "preparing"]}
        },
        background=True
    )

    safe_create_index(
        menu_collection,
        [("available", ASCENDING)],
        background=True
    )

    safe_create_index(
        feedback_collection,
        [("created_at", DESCENDING)],
        background=True
    )

    safe_create_index(
        feedback_collection,
        [("order_id", ASCENDING)],
        background=True
    )

    safe_create_index(
        wallet_collection,
        [("user_id", ASCENDING)],
        unique=True,
        background=True
    )

    safe_create_index(
        wallet_txn_collection,
        [("user_id", ASCENDING), ("created_at", DESCENDING)],
        background=True
    )

    safe_create_index(
        wallet_txn_collection,
        [("type", ASCENDING)],
        background=True
    )

    safe_create_index(
        wallet_txn_collection,
        [("source", ASCENDING)],
        background=True
    )

    safe_create_index(
        otp_collection,
        [("expires_at", ASCENDING)],
        expireAfterSeconds=0,
        background=True
    )

    safe_create_index(
        otp_collection,
        [("email", ASCENDING)],
        background=True
    )

    logger.info("✅ MongoDB indexes initialized")

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