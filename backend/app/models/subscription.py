import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class SubscriptionStatus(str, enum.Enum):
    ACTIVE = "active"
    PAST_DUE = "past_due"
    CANCELED = "canceled"
    TRIALING = "trialing"
    INCOMPLETE = "incomplete"

class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    plan_id = Column(UUID(as_uuid=True), ForeignKey("plans.id"), nullable=False)
    stripe_subscription_id = Column(String(255), unique=True, nullable=True)
    status = Column(Enum(SubscriptionStatus), default=SubscriptionStatus.INCOMPLETE)
    current_period_start = Column(DateTime, nullable=True)
    current_period_end = Column(DateTime, nullable=True)
    cancel_at_period_end = Column(Boolean, default=False)
    canceled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="subscriptions")
    plan = relationship("Plan", back_populates="subscriptions")
    transactions = relationship("Transaction", back_populates="subscription")
