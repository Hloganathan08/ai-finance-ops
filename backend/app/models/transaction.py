import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Enum, Numeric, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum

class TransactionStatus(str, enum.Enum):
    PENDING = "pending"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIALLY_REFUNDED = "partially_refunded"

class TransactionType(str, enum.Enum):
    PAYMENT = "payment"
    REFUND = "refund"
    INVOICE = "invoice"

class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    subscription_id = Column(UUID(as_uuid=True), ForeignKey("subscriptions.id"), nullable=True)
    stripe_payment_intent_id = Column(String(255), unique=True, nullable=True)
    stripe_invoice_id = Column(String(255), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="usd")
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    type = Column(Enum(TransactionType), default=TransactionType.PAYMENT)
    failure_reason = Column(Text, nullable=True)
    idempotency_key = Column(String(255), unique=True, nullable=True)
    metadata_ = Column("metadata", Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    tenant = relationship("Tenant", back_populates="transactions")
    subscription = relationship("Subscription", back_populates="transactions")
