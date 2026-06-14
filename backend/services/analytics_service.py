"""Advanced analytics service for E-Canteen."""
from datetime import datetime, timedelta, timezone
from database import orders_collection, menu_collection

IST = timezone(timedelta(hours=5, minutes=30))


def _start_of_day(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def get_analytics_data() -> dict:
    """Get comprehensive analytics data - Optimized with single queries."""
    now = datetime.now(IST)
    today_start = _start_of_day(now)
    month_start = _start_of_month(now)
    thirty_days_ago = today_start - timedelta(days=30)
    seven_days_ago = today_start - timedelta(days=7)
    
    # OPTIMIZED: Single query for revenue and orders trend (last 30 days)
    daily_stats_cursor = orders_collection.aggregate([
        {
            "$match": {
                "created_at": {"$gte": thirty_days_ago, "$lt": today_start + timedelta(days=1)},
            }
        },
        {
            "$group": {
                "_id": {
                    "date": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                },
                "revenue": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$payment_status", "paid"]}, {"$eq": ["$status", "completed"]}]},
                            "$total_amount",
                            0,
                        ]
                    }
                },
                "orders": {"$sum": 1},
            }
        },
        {"$sort": {"_id.date": 1}},
    ])
    
    daily_stats = {doc["_id"]["date"]: doc for doc in daily_stats_cursor}
    
    # Build revenue and orders trend from single query result
    revenue_trend = []
    orders_trend = []
    for offset in range(29, -1, -1):
        day = (today_start - timedelta(days=offset)).strftime("%Y-%m-%d")
        stats = daily_stats.get(day, {"revenue": 0, "orders": 0})
        revenue_trend.append({
            "date": day,
            "revenue": int(stats.get("revenue", 0)),
            "orders": stats.get("orders", 0),
        })
        orders_trend.append({
            "date": day,
            "orders": stats.get("orders", 0),
        })
    
    # OPTIMIZED: Single query for peak hours (last 7 days)
    peak_hours_cursor = orders_collection.aggregate([
        {
            "$match": {
                "created_at": {"$gte": seven_days_ago},
            }
        },
        {
            "$group": {
                "_id": {"$hour": "$created_at"},
                "count": {"$sum": 1},
            }
        },
        {"$sort": {"_id": 1}},
    ])
    
    peak_hours_map = {doc["_id"]: doc["count"] for doc in peak_hours_cursor}
    peak_hours = [
        {"hour": f"{hour:02d}:00", "orders": peak_hours_map.get(hour, 0)}
        for hour in range(24)
    ]
    
    # OPTIMIZED: Single query for daily revenue (last 7 days)
    daily_revenue_cursor = orders_collection.aggregate([
        {
            "$match": {
                "payment_status": "paid",
                "status": "completed",
                "created_at": {"$gte": seven_days_ago},
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%a", "date": "$created_at"}},
                "revenue": {"$sum": "$total_amount"},
            }
        },
    ])
    
    daily_revenue_map = {doc["_id"]: int(doc["revenue"]) for doc in daily_revenue_cursor}
    daily_revenue = [
        {"date": (today_start - timedelta(days=offset)).strftime("%a"), "revenue": daily_revenue_map.get((today_start - timedelta(days=offset)).strftime("%a"), 0)}
        for offset in range(6, -1, -1)
    ]
    
    # OPTIMIZED: Single query for monthly revenue (last 6 months)
    monthly_revenue_cursor = orders_collection.aggregate([
        {
            "$match": {
                "payment_status": "paid",
                "status": "completed",
                "created_at": {"$gte": month_start - timedelta(days=180)},
            }
        },
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%b %Y", "date": "$created_at"}},
                "revenue": {"$sum": "$total_amount"},
            }
        },
        {"$sort": {"_id": 1}},
    ])
    
    monthly_revenue = [
        {"month": doc["_id"], "revenue": int(doc["revenue"])}
        for doc in monthly_revenue_cursor
    ]
    
    # Top selling products (already optimized)
    top_products_cursor = orders_collection.aggregate([
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.name",
                "total_sold": {"$sum": "$items.quantity"},
                "revenue": {"$sum": {"$multiply": ["$items.price", "$items.quantity"]}},
            }
        },
        {"$sort": {"total_sold": -1}},
        {"$limit": 10},
    ])
    
    top_products = [
        {
            "name": doc["_id"],
            "total_sold": doc["total_sold"],
            "revenue": int(doc["revenue"]),
        }
        for doc in top_products_cursor
    ]
    
    # Walk-in vs Online comparison (already optimized)
    comparison_cursor = orders_collection.aggregate([
        {
            "$match": {
                "created_at": {"$gte": month_start},
            }
        },
        {
            "$group": {
                "_id": "$order_type",
                "count": {"$sum": 1},
                "revenue": {
                    "$sum": {
                        "$cond": [
                            {"$and": [{"$eq": ["$payment_status", "paid"]}, {"$eq": ["$status", "completed"]}]},
                            "$total_amount",
                            0,
                        ]
                    },
                },
            }
        },
    ])
    
    comparison = {
        doc.get("_id", "unknown"): {
            "count": doc["count"],
            "revenue": int(doc["revenue"]),
        }
        for doc in comparison_cursor
    }
    
    return {
        "revenue_trend": revenue_trend,
        "orders_trend": orders_trend,
        "peak_hours": peak_hours,
        "daily_revenue": daily_revenue,
        "monthly_revenue": monthly_revenue,
        "top_products": top_products,
        "comparison": comparison,
    }
