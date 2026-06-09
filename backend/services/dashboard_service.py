"""Real-time dashboard metrics from MongoDB."""
from datetime import datetime, timedelta, timezone

from database import orders_collection
from services.order_id_service import format_order_code

IST = timezone(timedelta(hours=5, minutes=30))


def _start_of_day(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def _is_walkin(order_type: str | None) -> bool:
    return (order_type or "").lower().replace("_", "-") == "walk-in"


def _serialize_recent(order: dict) -> dict:
    created = order.get("created_at")
    return {
        "_id": str(order["_id"]),
        "order_id": order.get("order_id"),
        "order_code": format_order_code(order),
        "user_name": order.get("user_name"),
        "order_type": order.get("order_type"),
        "total_amount": order.get("total_amount"),
        "status": order.get("status"),
        "created_at": created.isoformat() if created else None,
    }


def get_admin_dashboard_stats() -> dict:
    now = datetime.now(IST)
    today_start = _start_of_day(now)
    month_start = _start_of_month(now)

    paid_completed = {
        "payment_status": "paid",
        "status": "completed",
    }

    total_orders = orders_collection.count_documents({})
    active_orders = orders_collection.count_documents(
        {"status": {"$in": ["pending", "preparing"]}}
    )
    completed_orders = orders_collection.count_documents({"status": "completed"})

    revenue_cursor = orders_collection.aggregate([
        {"$match": paid_completed},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ])
    revenue = next(revenue_cursor, {}).get("total", 0) or 0

    online_today = orders_collection.count_documents({
        "created_at": {"$gte": today_start},
        "order_type": "online",
    })
    walkin_today = orders_collection.count_documents({
        "created_at": {"$gte": today_start},
        "order_type": {"$in": ["walk-in", "walk_in"]},
    })

    revenue_today_cursor = orders_collection.aggregate([
        {"$match": {**paid_completed, "created_at": {"$gte": today_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ])
    revenue_today = next(revenue_today_cursor, {}).get("total", 0) or 0

    revenue_month_cursor = orders_collection.aggregate([
        {"$match": {**paid_completed, "created_at": {"$gte": month_start}}},
        {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
    ])
    revenue_month = next(revenue_month_cursor, {}).get("total", 0) or 0

    recent_orders = [
        _serialize_recent(o)
        for o in orders_collection.find().sort("created_at", -1).limit(10)
    ]

    # Weekly revenue chart (last 7 days, paid completed)
    chart_data = []
    for offset in range(6, -1, -1):
        day = today_start - timedelta(days=offset)
        next_day = day + timedelta(days=1)
        day_cursor = orders_collection.aggregate([
            {
                "$match": {
                    **paid_completed,
                    "created_at": {"$gte": day, "$lt": next_day},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
        ])
        day_total = next(day_cursor, {}).get("total", 0) or 0
        chart_data.append({
            "name": day.strftime("%a"),
            "revenue": int(day_total),
        })

    return {
        "total_orders": total_orders,
        "active_orders": active_orders,
        "completed_orders": completed_orders,
        "revenue": int(revenue),
        "online_orders_today": online_today,
        "walkin_orders_today": walkin_today,
        "revenue_today": int(revenue_today),
        "revenue_month": int(revenue_month),
        "recent_orders": recent_orders,
        "chart_data": chart_data,
    }
