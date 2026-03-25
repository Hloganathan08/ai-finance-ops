from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.subscription import SubscriptionCreate, SubscriptionResponse
from app.services.subscription_service import (
    create_subscription,
    cancel_subscription,
    get_tenant_subscriptions
)
from app.api.dependencies import get_current_user, get_current_tenant_id
from app.models.user import User
import uuid

router = APIRouter(prefix="/subscriptions", tags=["subscriptions"])

@router.get("", response_model=List[SubscriptionResponse])
def list_subscriptions(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_tenant_subscriptions(tenant_id, db)

@router.post("", response_model=SubscriptionResponse)
def subscribe(
    data: SubscriptionCreate,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_subscription(tenant_id, data, db)

@router.delete("/{subscription_id}", response_model=SubscriptionResponse)
def cancel(
    subscription_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return cancel_subscription(tenant_id, subscription_id, db)
