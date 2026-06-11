"""Generate unique order codes: E-101 (online), W-101 (walk-in)."""
from pymongo import ReturnDocument
import traceback

from database import counters_collection

ONLINE_COUNTER = "online_order_id"
WALKIN_COUNTER = "walkin_order_id"
START_SEQ = 100


def _next_seq(counter_key: str, session=None) -> int:
    try:
        # Initialize counter if it doesn't exist
        existing = counters_collection.find_one({"_id": counter_key}, session=session)
        if not existing:
            counters_collection.insert_one(
                {"_id": counter_key, "seq": START_SEQ - 1},
                session=session
            )
            print(f"Counter initialized: {counter_key} = {START_SEQ - 1}")

        doc = counters_collection.find_one_and_update(
            {"_id": counter_key},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        seq = int(doc["seq"])
        print(f"Generated order number: {counter_key} = {seq}")
        return seq
    except Exception as e:
        print(f"ERROR generating order ID for {counter_key}: {str(e)}")
        print(traceback.format_exc())
        raise


def next_online_order(session=None) -> tuple[int, str]:
    seq = _next_seq(ONLINE_COUNTER, session=session)
    return seq, f"E-{seq}"


def next_walkin_order(session=None) -> tuple[int, str]:
    seq = _next_seq(WALKIN_COUNTER, session=session)
    return seq, f"W-{seq}"


def format_order_code(order: dict) -> str:
    if order.get("order_code"):
        return str(order["order_code"])
    seq = order.get("order_id")
    if seq is None:
        return "—"
    order_type = (order.get("order_type") or "online").lower().replace("_", "-")
    prefix = "W" if order_type == "walk-in" else "E"
    return f"{prefix}-{seq}"
