"""Reports service for E-Canteen."""
from datetime import datetime, timedelta, timezone
from database import orders_collection, menu_collection

IST = timezone(timedelta(hours=5, minutes=30))


def _start_of_day(now: datetime) -> datetime:
    return now.replace(hour=0, minute=0, second=0, microsecond=0)


def _start_of_week(now: datetime) -> datetime:
    return now - timedelta(days=now.weekday())


def _start_of_month(now: datetime) -> datetime:
    return now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)


def generate_report(report_type: str) -> dict:
    """Generate report based on type (daily, weekly, monthly)."""
    now = datetime.now(IST)
    
    if report_type == "daily":
        start_date = _start_of_day(now)
        end_date = start_date + timedelta(days=1)
    elif report_type == "weekly":
        start_date = _start_of_week(now)
        end_date = start_date + timedelta(days=7)
    elif report_type == "monthly":
        start_date = _start_of_month(now)
        end_date = (start_date + timedelta(days=32)).replace(day=1)
    else:
        raise ValueError(f"Invalid report type: {report_type}")
    
    # Get orders in date range
    orders_cursor = orders_collection.find({
        "created_at": {"$gte": start_date, "$lt": end_date}
    }).sort("created_at", -1)
    
    orders = list(orders_cursor)
    
    # Calculate metrics
    total_orders = len(orders)
    total_revenue = sum(o.get("total_amount", 0) for o in orders if o.get("payment_status") == "paid" and o.get("status") == "completed")
    
    online_orders = [o for o in orders if o.get("order_type") == "online"]
    walkin_orders = [o for o in orders if o.get("order_type") in ["walk-in", "walk_in"]]
    
    online_count = len(online_orders)
    walkin_count = len(walkin_orders)
    
    online_revenue = sum(o.get("total_amount", 0) for o in online_orders if o.get("payment_status") == "paid" and o.get("status") == "completed")
    walkin_revenue = sum(o.get("total_amount", 0) for o in walkin_orders if o.get("payment_status") == "paid" and o.get("status") == "completed")
    
    # Top products
    product_sales = {}
    for order in orders:
        for item in order.get("items", []):
            name = item.get("name", "Unknown")
            qty = item.get("quantity", 0)
            product_sales[name] = product_sales.get(name, 0) + qty
    
    top_products = sorted(product_sales.items(), key=lambda x: x[1], reverse=True)[:10]
    
    return {
        "report_type": report_type,
        "start_date": start_date.isoformat(),
        "end_date": end_date.isoformat(),
        "generated_at": now.isoformat(),
        "summary": {
            "total_orders": total_orders,
            "total_revenue": int(total_revenue),
            "online_orders": online_count,
            "walkin_orders": walkin_count,
            "online_revenue": int(online_revenue),
            "walkin_revenue": int(walkin_revenue),
        },
        "top_products": [{"name": name, "quantity": qty} for name, qty in top_products],
        "orders": [
            {
                "order_id": o.get("order_code") or o.get("order_id"),
                "order_type": o.get("order_type"),
                "status": o.get("status"),
                "total_amount": o.get("total_amount"),
                "created_at": o.get("created_at").isoformat() if o.get("created_at") else None,
                "items": o.get("items", []),
            }
            for o in orders
        ],
    }
