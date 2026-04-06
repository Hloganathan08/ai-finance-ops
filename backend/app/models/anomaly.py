import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Text, Enum
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from app.db.database import Base
import enum


class AnomalySeverity(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AnomalyType(str, enum.Enum):
    HIGH_FAILURE_RATE = "high_failure_rate"
    VELOCITY_SPIKE = "velocity_spike"
    LARGE_TRANSACTION = "large_transaction"
    UNUSUAL_REFUND = "unusual_refund"
    REPEATED_FAILURES = "repeated_failures"


class Anomaly(Base):
    __tablename__ = "anomalies"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tenant_id = Column(UUID(as_uuid=True), ForeignKey("tenants.id"), nullable=False)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=True)
    anomaly_type = Column(Enum(AnomalyType), nullable=False)
    severity = Column(Enum(AnomalySeverity), nullable=False)
    description = Column(Text, nullable=False)
    ai_explanation = Column(Text, nullable=True)
    resolved = Column(String(10), default="false")
    detected_at = Column(DateTime, default=datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)

    tenant = relationship("Tenant")
    transaction = relationship("Transaction")
