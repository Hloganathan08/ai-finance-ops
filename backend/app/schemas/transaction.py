from pydantic import BaseModel
from uuid import UUID
from datetime import datetime
from typing import Optional
from decimal import Decimal
from app.models.transaction import TransactionStatus, TransactionType

class TransactionResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    subscription_id: Optional[UUID]
    amount: Decimal
    currency: str
    status: TransactionStatus
    type: TransactionType
    failure_reason: Optional[str]
    stripe_payment_intent_id: Optional[str]
    created_at: datetime

    model_config = {"from_attributes": True}

class RefundRequest(BaseModel):
    transaction_id: UUID
    reason: Optional[str] = None
