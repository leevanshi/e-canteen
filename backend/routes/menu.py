from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime, timezone, timedelta

from database import menu_collection
from routes.auth import get_current_user

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(
    prefix="/menu",
    tags=["Menu"]
)

# ================= SCHEMAS =================

class MenuItemCreate(BaseModel):
    name: str = Field(..., min_length=2)
    description: Optional[str] = None
    price: float = Field(..., gt=0)
    category: Optional[str] = "general"
    image: Optional[str] = None
    available: bool = True


class MenuItemUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[float]
    category: Optional[str]
    image: Optional[str]
    available: Optional[bool]


# ================= GET MENU =================

@router.get("/")
def get_menu():

    items = menu_collection.find({"available": True})

    result = []

    for item in items:
        result.append({
            "_id": str(item["_id"]),
            "name": item.get("name"),
            "description": item.get("description"),
            "price": item.get("price"),
            "category": item.get("category"),
            "image": item.get("image"),
            "available": item.get("available", True)
        })

    return result


# ================= ADMIN GET ALL MENU =================

@router.get("/admin")
def get_all_menu(current_user=Depends(get_current_user)):

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    items = menu_collection.find().sort("created_at", -1)

    result = []

    for item in items:
        item["_id"] = str(item["_id"])
        result.append(item)

    return result


# ================= CREATE MENU ITEM =================

@router.post("/admin")
def create_menu_item(
    data: MenuItemCreate,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    now = datetime.now(IST)

    menu_id = menu_collection.insert_one({
        "name": data.name.strip(),
        "description": data.description,
        "price": data.price,
        "category": data.category,
        "image": data.image,
        "available": data.available,
        "created_at": now,
        "updated_at": now
    }).inserted_id

    return {
        "message": "Menu item created",
        "id": str(menu_id)
    }


# ================= UPDATE MENU ITEM =================

@router.put("/admin/{item_id}")
def update_menu_item(
    item_id: str,
    data: MenuItemUpdate,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid menu ID")

    update_data = {
        k: v for k, v in data.model_dump().items()
        if v is not None
    }

    if not update_data:
        raise HTTPException(status_code=400, detail="No fields to update")

    update_data["updated_at"] = datetime.now(IST)

    result = menu_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return {"message": "Menu item updated"}


# ================= DELETE MENU ITEM =================

@router.delete("/admin/{item_id}")
def delete_menu_item(
    item_id: str,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")

    if not ObjectId.is_valid(item_id):
        raise HTTPException(status_code=400, detail="Invalid menu ID")

    result = menu_collection.delete_one(
        {"_id": ObjectId(item_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Menu item not found")

    return {"message": "Menu item deleted"}