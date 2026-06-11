"""Advanced analytics service for E-Canteen."""
from datetime import datetime, timedelta, timezone
from database import orders_collection, menu_collection

IST = timezone(timedelta(hours=5, minutes=30))


def _start_of_day(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_month(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def get_analytics_data() -> dict:
    """Get comprehensive analytics data."""
    now = datetime.now(IST)
    today_start = _start_of_day(now)
    month_start = _start_of_month(now)
    
    # Revenue trend (last 30 days)
    revenue_trend = []
    for offset in range(29, -1, -1):
        day = today_start - timedelta(days=offset)
        next_day = day + timedelta(days=1)
        
        day_cursor = orders_collection.aggregate([
            {
                "$match": {
                    "payment_status": "paid",
                    "status": "completed",
                    "created_at": {"$gte": day, "$lt": next_day},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}, "count": {"$sum": 1}}},
        ])
        day_result = next(day_cursor, {})
        revenue_trend.append({
            "date": day.strftime("%Y-%m-%d"),
            "revenue": int(day_result.get("total", 0) or 0),
            "orders": day_result.get("count", 0) or 0,
        })
    
    # Orders trend (last 30 days)
    orders_trend = []
    for offset in range(29, -1, -1):
        day = today_start - timedelta(days=offset)
        next_day = day + timedelta(days=1)
        
        day_cursor = orders_collection.aggregate([
            {
                "$match": {
                    "created_at": {"$gte": day, "$lt": next_day},
                }
            },
            {"$group": {"_id": None, "count": {"$sum": 1}}},
        ])
        day_result = next(day_cursor, {})
        orders_trend.append({
            "date": day.strftime("%Y-%m-%d"),
            "orders": day_result.get("count", 0) or 0,
        })
    
    # Peak order hours (last 7 days)
    peak_hours = []
    for hour in range(24):
        hour_cursor = orders_collection.aggregate([
            {
                "$match": {
                    "created_at": {"$gte": today_start - timedelta(days=7)},
                    "$expr": {"$eq": [{"$hour": "$created_at"}, hour]},
                }
            },
            {"$group": {"_id": None, "count": {"$sum": 1}}},
        ])
        hour_result = next(hour_cursor, {})
        peak_hours.append({
            "hour": f"{hour:02d}:00",
            "orders": hour_result.get("count", 0) or 0,
        })
    
    # Daily revenue (last 7 days)
    daily_revenue = []
    for offset in range(6, -1, -1):
        day = today_start - timedelta(days=offset)
        next_day = day + timedelta(days=1)
        
        day_cursor = orders_collection.aggregate([
            {
                "$match": {
                    "payment_status": "paid",
                    "status": "completed",
                    "created_at": {"$gte": day, "$lt": next_day},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
        ])
        day_result = next(day_cursor, {})
        daily_revenue.append({
            "date": day.strftime("%a"),
            "revenue": int(day_result.get("total", 0) or 0),
        })
    
    # Monthly revenue (last 6 months)
    monthly_revenue = []
    for offset in range(5, -1, -1):
        month = now.replace(day=1) - timedelta(days=offset * 30)
        month_end = (month + timedelta(days=32)).replace(day=1)
        
        month_cursor = orders_collection.aggregate([
            {
                "$match": {
                    "payment_status": "paid",
                    "status": "completed",
                    "created_at": {"$gte": month, "$lt": month_end},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$total_amount"}}},
        ])
        month_result = next(month_cursor, {})
        monthly_revenue.append({
            "month": month.strftime("%b %Y"),
            "revenue": int(month_result.get("total", 0) or 0),
        })
    
    # Top selling products
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
    
    top_products = []
    for doc in top_products_cursor:
        top_products.append({
            "name": doc["_id"],
            "total_sold": doc["total_sold"],
            "revenue": int(doc["revenue"]),
        })
    
    # Walk-in vs Online comparison
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
    
    comparison = {}
    for doc in comparison_cursor:
        order_type = doc.get("_id", "unknown")
        comparison[order_type] = {
            "count": doc["count"],
            "revenue": int(doc["revenue"]),
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
