from fastapi import APIRouter, Depends, HTTPException
from bson import ObjectId
from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime, timezone, timedelta

from database import inventory_collection, menu_collection
from routes.auth import get_current_user

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/inventory", tags=["Inventory"])


class InventoryItemCreate(BaseModel):
    menu_item_id: str
    stock: int = Field(..., ge=0)
    low_stock_threshold: int = Field(default=10, ge=0)

    @field_validator('stock', 'low_stock_threshold')
    @classmethod
    def validate_not_nan(cls, v):
        if v is not None and (v != v):  # NaN check
            raise ValueError('Value cannot be NaN')
        return v


class InventoryItemUpdate(BaseModel):
    stock: Optional[int] = Field(None, ge=0)
    low_stock_threshold: Optional[int] = Field(None, ge=0)

    @field_validator('stock', 'low_stock_threshold')
    @classmethod
    def validate_not_nan(cls, v):
        if v is not None and (v != v):  # NaN check
            raise ValueError('Value cannot be NaN')
        return v


@router.get("/")
def get_inventory(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    inventory = list(inventory_collection.find())
    result = []
    
    for item in inventory:
        menu_item = menu_collection.find_one({"_id": ObjectId(item["menu_item_id"])})
        result.append({
            "_id": str(item["_id"]),
            "menu_item_id": item["menu_item_id"],
            "menu_item_name": menu_item["name"] if menu_item else "Unknown",
            "stock": item["stock"],
            "low_stock_threshold": item["low_stock_threshold"],
            "status": "out_of_stock" if item["stock"] == 0 else "low_stock" if item["stock"] <= item["low_stock_threshold"] else "in_stock",
            "updated_at": item.get("updated_at").isoformat() if item.get("updated_at") else None,
        })
    
    return result


@router.post("/")
def create_inventory_item(data: InventoryItemCreate, current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    if not ObjectId.is_valid(data.menu_item_id):
        raise HTTPException(400, "Invalid menu item ID")
    
    menu_item = menu_collection.find_one({"_id": ObjectId(data.menu_item_id)})
    if not menu_item:
        raise HTTPException(404, "Menu item not found")
    
    existing = inventory_collection.find_one({"menu_item_id": data.menu_item_id})
    if existing:
        raise HTTPException(400, "Inventory item already exists")
    
    now = datetime.now(IST)
    
    inventory_collection.insert_one({
        "menu_item_id": data.menu_item_id,
        "stock": data.stock,
        "low_stock_threshold": data.low_stock_threshold,
        "created_at": now,
        "updated_at": now,
    })
    
    # Update menu availability based on stock
    if data.stock == 0:
        menu_collection.update_one(
            {"_id": ObjectId(data.menu_item_id)},
            {"$set": {"available": False, "updated_at": now}}
        )
    
    return {"message": "Inventory item created"}


@router.put("/{item_id}")
def update_inventory_item(item_id: str, data: InventoryItemUpdate, current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid inventory ID")
    
    update_data = {
        k: v for k, v in data.model_dump().items()
        if v is not None
    }
    
    if not update_data:
        raise HTTPException(400, "No fields to update")
    
    update_data["updated_at"] = datetime.now(IST)
    
    result = inventory_collection.update_one(
        {"_id": ObjectId(item_id)},
        {"$set": update_data}
    )
    
    if result.matched_count == 0:
        raise HTTPException(404, "Inventory item not found")
    
    # Update menu availability based on stock
    if "stock" in update_data:
        inventory_item = inventory_collection.find_one({"_id": ObjectId(item_id)})
        if inventory_item:
            if update_data["stock"] == 0:
                menu_collection.update_one(
                    {"_id": ObjectId(inventory_item["menu_item_id"])},
                    {"$set": {"available": False, "updated_at": datetime.now(IST)}}
                )
            elif inventory_item.get("stock") == 0 and update_data["stock"] > 0:
                menu_collection.update_one(
                    {"_id": ObjectId(inventory_item["menu_item_id"])},
                    {"$set": {"available": True, "updated_at": datetime.now(IST)}}
                )
    
    return {"message": "Inventory item updated"}


@router.delete("/{item_id}")
def delete_inventory_item(item_id: str, current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    if not ObjectId.is_valid(item_id):
        raise HTTPException(400, "Invalid inventory ID")
    
    result = inventory_collection.delete_one({"_id": ObjectId(item_id)})
    
    if result.deleted_count == 0:
        raise HTTPException(404, "Inventory item not found")
    
    return {"message": "Inventory item deleted"}


@router.get("/alerts")
def get_inventory_alerts(current_user=Depends(get_current_user)):
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    alerts = []
    
    # Low stock alerts
    low_stock = list(inventory_collection.find({
        "stock": {"$gt": 0, "$lte": "$low_stock_threshold"}
    }))
    
    for item in low_stock:
        menu_item = menu_collection.find_one({"_id": ObjectId(item["menu_item_id"])})
        alerts.append({
            "type": "low_stock",
            "menu_item_name": menu_item["name"] if menu_item else "Unknown",
            "stock": item["stock"],
            "threshold": item["low_stock_threshold"],
        })
    
    # Out of stock alerts
    out_of_stock = list(inventory_collection.find({"stock": 0}))
    
    for item in out_of_stock:
        menu_item = menu_collection.find_one({"_id": ObjectId(item["menu_item_id"])})
        alerts.append({
            "type": "out_of_stock",
            "menu_item_name": menu_item["name"] if menu_item else "Unknown",
            "stock": 0,
        })
    
    return alerts
