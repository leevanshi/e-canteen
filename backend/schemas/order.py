from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from enum import Enum

# =========================
# ENUMS
# =========================

class PaymentMethod(str, Enum):
    cash = "cash"
    online = "online"

# =========================
# MODELS
# =========================

class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int
    image: str

class OrderCreate(BaseModel):
    user_name: str
    items: List[OrderItem]
    total_amount: float
    pickup_time: datetime
    payment_method: PaymentMethod
    instruction: Optional[str] = None

class StatusHistory(BaseModel):
    status: str
    time: datetime

class OrderResponse(BaseModel):
    order_id: str
    user_id: Optional[str]

    user_name: str
    items: List[OrderItem]
    total_amount: float
    pickup_time: datetime
    payment_method: PaymentMethod

    status: str = "pending"
    instruction: Optional[str] = None
    created_at: datetime
    status_history: List[StatusHistory] = []

    model_config = ConfigDict(from_attributes=True)