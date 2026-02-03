from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from datetime import datetime, timezone, timedelta
from bson import ObjectId
from routes.auth import get_current_user

from database import feedback_collection, orders_collection

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/api/feedback",
    tags=["Feedback"]
)

# =========================
# SCHEMA
# =========================
class FeedbackCreate(BaseModel):
    order_id: str
    rating: int = Field(..., ge=1, le=5)
    comment: str | None = None


# =========================
# USER ➜ SUBMIT FEEDBACK
# =========================
@router.post("/")
def submit_feedback(
    payload: FeedbackCreate,
    current_user=Depends(get_current_user)
):
    order = orders_collection.find_one({
        "_id": ObjectId(payload.order_id),
        "user_id": ObjectId(current_user["id"])
    })

    if not order:
        raise HTTPException(404, "Order not found")

    if order["status"] not in ["delivered", "completed"]:
        raise HTTPException(
            400,
            "Feedback allowed only after order completion"
        )

    # 🚫 Prevent duplicate feedback
    existing = feedback_collection.find_one({
        "order_id": ObjectId(payload.order_id)
    })

    if existing:
        raise HTTPException(
            400,
            "Feedback already submitted for this order"
        )

    feedback_collection.insert_one({
        "order_id": ObjectId(payload.order_id),
        "user_id": ObjectId(current_user["id"]),
        "rating": payload.rating,
        "comment": payload.comment,
        "created_at": datetime.now(IST)
    })

    return {"message": "Feedback submitted successfully"}
# =========================
# ADMIN ➜ VIEW ALL FEEDBACK
# =========================
@router.get("/admin")
def get_all_feedback(current_user=Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(403, "Admin access required")

    feedbacks = list(feedback_collection.find().sort("created_at", -1))

    response = []

    for f in feedbacks:
        order = orders_collection.find_one(
            {"_id": f["order_id"]},
            {"user_name": 1, "order_id": 1}
        )

        response.append({
            "_id": str(f["_id"]),
            "order_id": str(f["order_id"]),
            "rating": f["rating"],
            "comment": f.get("comment"),
            "created_at": f["created_at"],
            "user_name": order.get("user_name") if order else "Unknown"
        })

    return response
