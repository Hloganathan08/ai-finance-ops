import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Integer, Numeric, Enum, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class BillingInterval(str, enum.Enum):
    MONTHLY = "monthly"
    YEARLY = "yearly"

class Plan(Base):
    __tablename__ = "plans"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    price = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="usd")
    interval = Column(Enum(BillingInterval), default=BillingInterval.MONTHLY)
    stripe_price_id = Column(String(255), nullable=True)
    max_users = Column(Integer, default=5)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    subscriptions = relationship("Subscription", back_populates="plan")
