import json
import time
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime, timezone, timedelta

from database import menu_collection
from routes.auth import get_current_user
from services.nutrition_utils import extract_nutrition, calculate_health_score

# #region agent log
_DEBUG_LOG = Path(__file__).resolve().parents[2] / "debug-3e7df7.log"
def _agent_log(location, message, data, hypothesis_id):
    try:
        payload = {"sessionId": "3e7df7", "timestamp": int(time.time() * 1000), "location": location, "message": message, "data": data, "hypothesisId": hypothesis_id}
        with open(_DEBUG_LOG, "a", encoding="utf-8") as f:
            f.write(json.dumps(payload) + "\n")
    except Exception:
        pass
# #endregion

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
    
    # Nutrition fields
    calories: Optional[int] = 0
    protein: Optional[float] = 0.0
    carbs: Optional[float] = 0.0
    fats: Optional[float] = 0.0
    fiber: Optional[float] = 0.0
    sugar: Optional[float] = 0.0
    sodium: Optional[float] = 0.0
    serving_size: Optional[str] = "1 portion"
    health_score: Optional[int] = 0


class MenuItemUpdate(BaseModel):
    name: Optional[str]
    description: Optional[str]
    price: Optional[float] = Field(None, gt=0)
    category: Optional[str]
    image: Optional[str]
    available: Optional[bool]
    
    # Nutrition fields
    calories: Optional[int]
    protein: Optional[float]
    carbs: Optional[float]
    fats: Optional[float]
    fiber: Optional[float]
    sugar: Optional[float]
    sodium: Optional[float]
    serving_size: Optional[str]
    health_score: Optional[int]


# ================= GET MENU =================

@router.get("/")
def get_menu():

    items = menu_collection.find(
        {"available": True}
    ).sort("name", 1)

    result = []

    for item in items:
        nutrition = extract_nutrition(item)
        result.append({
            "_id": str(item["_id"]),
            "name": item.get("name"),
            "description": item.get("description"),
            "price": item.get("price"),
            "category": item.get("category"),
            "image": item.get("image"),
            "available": item.get("available", True),
            "nutrition": nutrition,
        })

    # #region agent log
    if result:
        sample = next((r for r in result if "Amritsari" in (r.get("name") or "")), result[0])
        _agent_log("menu.py:get_menu", "menu_nutrition_sample", {"name": sample.get("name"), "nutrition": sample.get("nutrition"), "count": len(result)}, "H4")
    # #endregion

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

    health_score = data.health_score
    if (not health_score or health_score == 0) and data.calories and data.calories > 0:
        health_score = calculate_health_score(
            data.calories, data.protein or 0, data.carbs or 0, data.fats or 0,
            data.fiber or 0, data.sugar or 0, data.sodium or 0,
        )

    menu_id = menu_collection.insert_one({
        "name": name,
        "description": data.description,
        "price": data.price,
        "category": (data.category or "general").lower(),
        "image": data.image,
        "available": data.available,
        "calories": data.calories,
        "protein": data.protein,
        "carbs": data.carbs,
        "fats": data.fats,
        "fiber": data.fiber,
        "sugar": data.sugar,
        "sodium": data.sodium,
        "serving_size": data.serving_size,
        "health_score": health_score,
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