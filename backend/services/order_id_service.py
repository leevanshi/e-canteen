"""Generate unique order codes: E-101 (online), W-101 (walk-in)."""
from pymongo import ReturnDocument

from database import counters_collection

ONLINE_COUNTER = "online_order_id"
WALKIN_COUNTER = "walkin_order_id"
START_SEQ = 100


def _next_seq(counter_key: str, session=None) -> int:
    doc = counters_collection.find_one_and_update(
        {"_id": counter_key},
        {"$inc": {"seq": 1}, "$setOnInsert": {"seq": START_SEQ - 1}},
        upsert=True,
        return_document=ReturnDocument.AFTER,
        session=session,
    )
    return int(doc["seq"])


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
