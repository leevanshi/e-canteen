from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
from datetime import datetime, timezone, timedelta

from routes.auth import get_current_user
from database import menu_collection

# 🔥 FIXED PREFIX
router = APIRouter(prefix="/menu", tags=["Menu"])

IST = timezone(timedelta(hours=5, minutes=30))

# =========================
# SCHEMAS
# =========================

class MenuItemBase(BaseModel):
    name: str
    price: float
    category: str
    available: bool = True
    image: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass

class MenuItemUpdate(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = None
    category: Optional[str] = None
    available: Optional[bool] = None
    image: Optional[str] = None


# =========================
# PUBLIC ROUTE
# GET /menu
# =========================
@router.get("/", response_model=List[dict])
def get_menu():
    items = list(menu_collection.find({"available": True}))

    for item in items:
        item["_id"] = str(item["_id"])

    return items


# =========================
# ADMIN ROUTES
# =========================

# GET ALL (including unavailable)
# /menu/all
@router.get("/all")
def get_all_menu(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    items = list(menu_collection.find({}))

    for item in items:
        item["_id"] = str(item["_id"])

    return items


@router.post("/")
def add_menu_item(
    data: MenuItemCreate,
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    item = {
        "name": data.name,
        "price": data.price,
        "category": data.category,
        "available": data.available,
        "image": data.image,
        "created_at": datetime.now(IST),
        "updated_at": None
    }

    result = menu_collection.insert_one(item)

    return {
        "success": True,
        "menu_id": str(result.inserted_id)
    }


@router.put("/{menu_id}")
def update_menu_item(
    menu_id: str,
    data: MenuItemUpdate,
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        mid = ObjectId(menu_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid menu id")

    update_data = {k: v for k, v in data.model_dump().items() if v is not None}

    if not update_data:
        raise HTTPException(status_code=400, detail="Nothing to update")

    update_data["updated_at"] = datetime.now(IST)

    result = menu_collection.update_one(
        {"_id": mid},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return {"success": True}


@router.delete("/{menu_id}")
def delete_menu_item(
    menu_id: str,
    current_user=Depends(get_current_user)
):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        mid = ObjectId(menu_id)
    except:
        raise HTTPException(status_code=400, detail="Invalid menu id")

    result = menu_collection.delete_one({"_id": mid})

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return {"success": True}