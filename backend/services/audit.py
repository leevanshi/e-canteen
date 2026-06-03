from datetime import datetime
from database import audit_collection, now_ist


def log_audit(action: str, user_id: str | None, ip: str | None = None, details: dict | None = None):
    """Insert a simple audit log entry.

    Fields:
    - action: short string
    - user_id: string or None
    - ip: optional client IP
    - details: optional dict
    - created_at: IST timestamp
    """
    entry = {
        "action": action,
        "user_id": user_id,
        "ip": ip,
        "details": details or {},
        "created_at": now_ist()
    }
    try:
        audit_collection.insert_one(entry)
    except Exception:
        # Do not raise — audit should not break the main flow
        pass
*** End Patch