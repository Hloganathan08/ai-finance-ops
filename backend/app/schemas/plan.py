from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from decimal import Decimal
from app.models.plan import BillingInterval

class PlanCreate(BaseModel):
    name: str
    description: Optional[str] = None
    price: Decimal
    currency: str = "usd"
    interval: BillingInterval = BillingInterval.MONTHLY
    max_users: int = 5

class PlanResponse(BaseModel):
    id: UUID
    name: str
    description: Optional[str]
    price: Decimal
    currency: str
    interval: BillingInterval
    max_users: int
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
