from pydantic import BaseModel
from typing import List
from datetime import datetime

class OrderItem(BaseModel):
    name: str
    price: float
    quantity: int
    image: str

class OrderCreate(BaseModel):
    user_name: str
    items: List[OrderItem]
    total_amount: float
    pickup_time: str
    payment_method: str

class StatusHistory(BaseModel):
    status: str
    time: datetime

class OrderResponse(BaseModel):
    order_id: int
    user_name: str
    items: List[OrderItem]
    total_amount: float
    pickup_time: str
    payment_method: str

    status: str
    instruction: str
    created_at: datetime
    status_history: List[StatusHistory]

    class Config:
        orm_mode = True
