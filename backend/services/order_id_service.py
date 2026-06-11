"""Generate unique order codes: E-101 (online), W-101 (walk-in)."""
from pymongo import ReturnDocument
import traceback

from database import counters_collection, orders_collection

ORDER_COUNTER = "order_id"
START_SEQ = 100


def _get_max_existing_order_id() -> int:
    """Get the maximum existing order_id from orders collection to avoid duplicates."""
    try:
        max_order = orders_collection.find_one(
            {},
            {"order_id": 1},
            sort=[("order_id", -1)]
        )
        if max_order and "order_id" in max_order:
            max_id = int(max_order["order_id"])
            print(f"Found max existing order_id: {max_id}")
            return max_id
        return START_SEQ - 1
    except Exception as e:
        print(f"ERROR getting max order_id: {str(e)}")
        return START_SEQ - 1


def _next_seq(session=None) -> int:
    """Generate next unique order ID using a single counter."""
    try:
        # Initialize counter if it doesn't exist
        existing = counters_collection.find_one({"_id": ORDER_COUNTER}, session=session)
        if not existing:
            # Start from the highest existing order_id to avoid duplicates
            max_existing = _get_max_existing_order_id()
            counters_collection.insert_one(
                {"_id": ORDER_COUNTER, "seq": max_existing},
                session=session
            )
            print(f"Counter initialized: {ORDER_COUNTER} = {max_existing}")

        doc = counters_collection.find_one_and_update(
            {"_id": ORDER_COUNTER},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        seq = int(doc["seq"])
        print(f"Generated order ID: {seq}")
        return seq
    except Exception as e:
        print(f"ERROR generating order ID: {str(e)}")
        print(traceback.format_exc())
        raise


def next_online_order(session=None) -> tuple[int, str]:
    """Generate next online order ID and code."""
    seq = _next_seq(session=session)
    order_code = f"E-{seq}"
    print(f"Generated Online Order - ID: {seq}, Code: {order_code}")
    return seq, order_code


def next_walkin_order(session=None) -> tuple[int, str]:
    """Generate next walk-in order ID and code."""
    seq = _next_seq(session=session)
    order_code = f"W-{seq}"
    print(f"Generated Walk-In Order - ID: {seq}, Code: {order_code}")
    return seq, order_code


def format_order_code(order: dict) -> str:
    """Format order code based on order type and order_id."""
    if order.get("order_code"):
        return str(order["order_code"])
    seq = order.get("order_id")
    if seq is None:
        return "—"
    order_type = (order.get("order_type") or "online").lower().replace("_", "-")
    prefix = "W" if order_type == "walk-in" else "E"
    return f"{prefix}-{seq}"
