from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from app.models.subscription import SubscriptionStatus

class SubscriptionCreate(BaseModel):
    plan_id: UUID

class SubscriptionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    plan_id: UUID
    status: SubscriptionStatus
    stripe_subscription_id: Optional[str]
    current_period_start: Optional[datetime]
    current_period_end: Optional[datetime]
    cancel_at_period_end: bool
    created_at: datetime

    model_config = {"from_attributes": True}
