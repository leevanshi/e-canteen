from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional
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
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str]
    image: Optional[str]
    available: Optional[bool]


# ================= GET MENU =================

@router.get("/")
def get_menu():

    items = menu_collection.find(
        {"available": True}
    ).sort("name", 1)

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
        raise HTTPException(403, "Admin only")

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
        raise HTTPException(403, "Admin only")

    now = datetime.now(IST)

    name = data.name.strip().title()

    menu_id = menu_collection.insert_one({
        "name": name,
        "description": data.description,
        "price": data.price,
        "category": (data.category or "general").lower(),
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
        raise HTTPException(403, "Admin only")

    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid menu ID")

    update_data = {
        k: v for k, v in data.model_dump().items()
        if v is not None
    }

    if not update_data:
        raise HTTPException(400, "No fields to update")

    if "name" in update_data:
        update_data["name"] = update_data["name"].strip().title()

    if "category" in update_data:
        update_data["category"] = update_data["category"].lower()

    update_data["updated_at"] = datetime.now(IST)

    result = menu_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Menu item not found")

    return {"message": "Menu item updated"}


# ================= SOFT DELETE MENU ITEM =================

@router.delete("/admin/{item_id}")
def delete_menu_item(
    item_id: str,
    current_user=Depends(get_current_user)
):

    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")

    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid menu ID")

    result = menu_collection.update_one(
        {"_id": ObjectId(item_id)},
        {
            "$set": {
                "available": False,
                "updated_at": datetime.now(IST)
            }
        }
    )

    if result.matched_count == 0:
        raise HTTPException(404, "Menu item not found")

    return {"message": "Menu item disabled"}