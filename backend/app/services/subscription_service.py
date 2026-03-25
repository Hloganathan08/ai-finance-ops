from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime, timedelta
from app.models.subscription import Subscription, SubscriptionStatus
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.plan import Plan
from app.models.audit_log import AuditLog
from app.schemas.subscription import SubscriptionCreate
import uuid
import json

def create_subscription(
    tenant_id: uuid.UUID,
    data: SubscriptionCreate,
    db: Session
) -> Subscription:
    # Check plan exists
    plan = db.query(Plan).filter(Plan.id == data.plan_id, Plan.is_active == True).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # Check if tenant already has active subscription
    existing = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id,
        Subscription.status == SubscriptionStatus.ACTIVE
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Tenant already has an active subscription")

    now = datetime.utcnow()
    period_end = now + timedelta(days=30)

    subscription = Subscription(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        plan_id=data.plan_id,
        status=SubscriptionStatus.ACTIVE,
        current_period_start=now,
        current_period_end=period_end,
    )
    db.add(subscription)
    db.flush()

    # Create initial transaction record
    transaction = Transaction(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        subscription_id=subscription.id,
        amount=plan.price,
        currency=plan.currency,
        status=TransactionStatus.SUCCEEDED,
        type=TransactionType.PAYMENT,
        idempotency_key=str(uuid.uuid4()),
    )
    db.add(transaction)

    # Write audit log
    audit = AuditLog(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        action="subscription.created",
        resource_type="subscription",
        resource_id=str(subscription.id),
        new_value=json.dumps({"plan_id": str(data.plan_id), "status": "active"}),
    )
    db.add(audit)
    db.commit()
    db.refresh(subscription)
    return subscription


def cancel_subscription(
    tenant_id: uuid.UUID,
    subscription_id: uuid.UUID,
    db: Session
) -> Subscription:
    subscription = db.query(Subscription).filter(
        Subscription.id == subscription_id,
        Subscription.tenant_id == tenant_id
    ).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    if subscription.status == SubscriptionStatus.CANCELED:
        raise HTTPException(status_code=400, detail="Subscription already canceled")

    subscription.status = SubscriptionStatus.CANCELED
    subscription.canceled_at = datetime.utcnow()
    subscription.cancel_at_period_end = True

    audit = AuditLog(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        action="subscription.canceled",
        resource_type="subscription",
        resource_id=str(subscription_id),
        new_value=json.dumps({"status": "canceled"}),
    )
    db.add(audit)
    db.commit()
    db.refresh(subscription)
    return subscription


def get_tenant_subscriptions(tenant_id: uuid.UUID, db: Session):
    return db.query(Subscription).filter(Subscription.tenant_id == tenant_id).all()
