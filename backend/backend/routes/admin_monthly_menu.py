from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime
import calendar
import pytz

from auth import get_current_user
from database import monthly_menus_collection

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

IST = pytz.timezone("Asia/Kolkata")


@router.post("/monthly-menu")
async def upload_monthly_menu(
    month: int,
    year: int,
    pdf_url: str,
    current_user=Depends(get_current_user),
):
    # 🔐 Admin check
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    # ⚠ Validate month
    if month < 1 or month > 12:
        raise HTTPException(status_code=400, detail="Invalid month")

    # ⚠ Validate year
    if year < 2020 or year > 2100:
        raise HTTPException(status_code=400, detail="Invalid year")

    month_name = calendar.month_name[month]
    now = datetime.now(IST)

    result = await monthly_menus_collection.update_one(
        {"month": month, "year": year},
        {
            "$set": {
                "month": month,
                "year": year,
                "month_name": month_name,
                "pdf_url": pdf_url,
                "updated_at": now,
            },
            "$setOnInsert": {
                "created_at": now
            },
        },
        upsert=True,
    )

    return {
        "message": "Monthly menu uploaded",
        "month": month,
        "year": year,
        "updated": bool(result.modified_count),
        "created": bool(result.upserted_id),
    }