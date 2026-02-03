from fastapi import APIRouter, Depends, HTTPException, Form
from datetime import datetime
import calendar

from auth import get_current_user
from database import monthly_menus_collection

router = APIRouter(
    prefix="/api/admin",
    tags=["Admin"]
)

@router.post("/monthly-menu")
async def upload_monthly_menu(
    month: int = Form(...),
    year: int = Form(...),
    pdf_url: str = Form(...),
    current_user=Depends(get_current_user),
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    month_name = calendar.month_name[month]
    now = datetime.utcnow()

    await monthly_menus_collection.update_one(
        {"month": month, "year": year},
        {
            "$set": {
                "month": month,
                "year": year,
                "month_name": month_name,
                "pdf_url": pdf_url,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    return {"message": "Monthly menu uploaded"}
