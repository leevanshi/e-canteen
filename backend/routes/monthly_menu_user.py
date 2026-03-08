from fastapi import APIRouter
from datetime import datetime
import pytz

from database import monthly_menus_collection

router = APIRouter(
    prefix="/api/monthly-menu",
    tags=["Monthly Menu"]
)

IST = pytz.timezone("Asia/Kolkata")


@router.get("/current")
async def get_current_month_menu():
    now = datetime.now(IST)

    month = now.month
    year = now.year

    menu = await monthly_menus_collection.find_one(
        {"month": month, "year": year}
    )

    # If menu not uploaded yet
    if not menu:
        return {
            "month": month,
            "year": year,
            "pdf_url": None
        }

    return {
        "month": menu.get("month"),
        "year": menu.get("year"),
        "month_name": menu.get("month_name"),
        "pdf_url": menu.get("pdf_url"),
        "updated_at": menu.get("updated_at")
    }