from fastapi import APIRouter
from datetime import datetime

from database import monthly_menu_collection

router = APIRouter(
    prefix="/api/monthly-menu",
    tags=["Monthly Menu"]
)


@router.get("/current")
async def get_current_month_menu():
    now = datetime.utcnow()
    month = now.strftime("%B")
    year = now.year

    menu = await monthly_menu_collection.find_one(
        {"month": month, "year": year}
    )

    if not menu:
        return {
            "month": month,
            "year": year,
            "pdf_url": None
        }

    menu["_id"] = str(menu["_id"])
    return menu
