from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from bson import ObjectId
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel
from typing import Optional
import os
import uuid

from database import monthly_menu_collection
from routes.auth import get_current_user

IST = timezone(timedelta(hours=5, minutes=30))

router = APIRouter(prefix="/api/monthly-menu", tags=["Monthly Menu"])

# ================= SCHEMA =================

class MonthlyMenuResponse(BaseModel):
    file_name: str
    file_url: str
    uploaded_at: str
    uploaded_by: str

# ================= HELPERS =================

def get_file_extension(filename: str) -> str:
    return os.path.splitext(filename)[1].lower()

def generate_unique_filename(original_filename: str) -> str:
    ext = get_file_extension(original_filename)
    unique_id = str(uuid.uuid4())[:8]
    return f"menu_{unique_id}{ext}"

# ================= UPLOAD PDF =================

@router.post("/upload")
async def upload_monthly_menu(
    file: UploadFile = File(...),
    current_user=Depends(get_current_user)
):
    print("=" * 50)
    print("UPLOAD MONTHLY MENU")
    print(f"User: {current_user.get('email')}")
    print(f"Filename: {file.filename}")
    print("=" * 50)
    
    # ROLE CHECK
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    # VALIDATE FILE TYPE
    if file.content_type != "application/pdf":
        raise HTTPException(400, "Only PDF files are allowed")
    
    # VALIDATE FILE SIZE (10 MB)
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    file_content = await file.read()
    if len(file_content) > MAX_SIZE:
        raise HTTPException(400, "File size exceeds 10 MB limit")
    
    # GENERATE UNIQUE FILENAME
    unique_filename = generate_unique_filename(file.filename)
    
    # SAVE FILE TO UPLOADS DIRECTORY
    upload_dir = "uploads/monthly_menu"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, unique_filename)
    with open(file_path, "wb") as f:
        f.write(file_content)
    
    # GENERATE FILE URL
    file_url = f"/uploads/monthly_menu/{unique_filename}"
    
    # DELETE OLD MENU IF EXISTS
    old_menu = monthly_menu_collection.find_one({})
    if old_menu:
        old_file_path = old_menu.get("file_url", "").replace("/uploads/", "uploads/")
        if os.path.exists(old_file_path):
            os.remove(old_file_path)
        monthly_menu_collection.delete_one({})
    
    # SAVE TO DATABASE
    now = datetime.now(IST)
    menu_data = {
        "file_name": file.filename,
        "file_url": file_url,
        "uploaded_at": now,
        "uploaded_by": current_user.get("email")
    }
    
    monthly_menu_collection.insert_one(menu_data)
    
    print(f"MENU UPLOADED: {file.filename}")
    print(f"FILE URL: {file_url}")
    print("=" * 50)
    
    return {
        "message": "Menu uploaded successfully",
        "file_name": file.filename,
        "file_url": file_url,
        "uploaded_at": now.isoformat(),
        "uploaded_by": current_user.get("email")
    }

# ================= GET MENU =================

@router.get("")
async def get_monthly_menu():
    print("FETCHING MONTHLY MENU")
    
    menu = monthly_menu_collection.find_one({})
    
    if not menu:
        return None
    
    return {
        "file_name": menu.get("file_name"),
        "file_url": menu.get("file_url"),
        "uploaded_at": menu.get("uploaded_at").isoformat() if menu.get("uploaded_at") else None,
        "uploaded_by": menu.get("uploaded_by")
    }

# ================= DELETE MENU =================

@router.delete("")
async def delete_monthly_menu(current_user=Depends(get_current_user)):
    print("=" * 50)
    print("DELETE MONTHLY MENU")
    print(f"User: {current_user.get('email')}")
    print("=" * 50)
    
    # ROLE CHECK
    if current_user.get("role") != "admin":
        raise HTTPException(403, "Admin only")
    
    # GET CURRENT MENU
    menu = monthly_menu_collection.find_one({})
    
    if not menu:
        raise HTTPException(404, "No menu found")
    
    # DELETE FILE
    file_path = menu.get("file_url", "").replace("/uploads/", "uploads/")
    if os.path.exists(file_path):
        os.remove(file_path)
    
    # DELETE FROM DATABASE
    monthly_menu_collection.delete_one({})
    
    print("MENU DELETED")
    print("=" * 50)
    
    return {"message": "Menu deleted successfully"}
