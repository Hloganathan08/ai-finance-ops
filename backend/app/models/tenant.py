import uuid
from datetime import datetime
from sqlalchemy import Column, String, Boolean, DateTime, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base

class Tenant(Base):
    __tablename__ = "tenants"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    slug = Column(String(100), unique=True, nullable=False)
    email = Column(String(255), unique=True, nullable=False)
    stripe_customer_id = Column(String(255), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    users = relationship("User", back_populates="tenant", cascade="all, delete-orphan")
    subscriptions = relationship("Subscription", back_populates="tenant", cascade="all, delete-orphan")
    transactions = relationship("Transaction", back_populates="tenant", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="tenant", cascade="all, delete-orphan")
