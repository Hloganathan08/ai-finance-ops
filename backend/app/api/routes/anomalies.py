from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime
from uuid import UUID
from app.db.database import get_db
from app.api.dependencies import get_current_user
from app.models.user import User
from app.models.anomaly import Anomaly, AnomalySeverity
from app.services.anomaly_service import get_ai_explanation
from pydantic import BaseModel


router = APIRouter(prefix="/anomalies", tags=["anomalies"])


class AnomalyResponse(BaseModel):
    id: UUID
    tenant_id: UUID
    transaction_id: Optional[UUID]
    anomaly_type: str
    severity: str
    description: str
    ai_explanation: Optional[str]
    resolved: str
    detected_at: datetime
    resolved_at: Optional[datetime]

    class Config:
        from_attributes = True


class AnomalyListResponse(BaseModel):
    anomalies: List[AnomalyResponse]
    total: int


@router.get("", response_model=AnomalyListResponse)
async def list_anomalies(
    severity: Optional[str] = Query(None),
    resolved: Optional[str] = Query(None),
    limit: int = Query(20, le=100),
    offset: int = Query(0),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """List anomalies for the current tenant."""
    query = db.query(Anomaly).filter(Anomaly.tenant_id == current_user.tenant_id)

    if severity:
        query = query.filter(Anomaly.severity == severity)
    if resolved:
        query = query.filter(Anomaly.resolved == resolved)

    total = query.count()
    anomalies = query.order_by(Anomaly.detected_at.desc()).offset(offset).limit(limit).all()

    return AnomalyListResponse(
        anomalies=[AnomalyResponse.model_validate(a) for a in anomalies],
        total=total,
    )


@router.get("/{anomaly_id}", response_model=AnomalyResponse)
async def get_anomaly(
    anomaly_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get a specific anomaly by ID."""
    anomaly = db.query(Anomaly).filter(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == current_user.tenant_id,
    ).first()

    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    return AnomalyResponse.model_validate(anomaly)


@router.post("/{anomaly_id}/resolve")
async def resolve_anomaly(
    anomaly_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mark an anomaly as resolved."""
    anomaly = db.query(Anomaly).filter(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == current_user.tenant_id,
    ).first()

    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    anomaly.resolved = "true"
    anomaly.resolved_at = datetime.utcnow()
    db.commit()

    return {"status": "resolved", "anomaly_id": str(anomaly_id)}


@router.post("/{anomaly_id}/explain")
async def explain_anomaly(
    anomaly_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Generate or regenerate AI explanation for an anomaly."""
    anomaly = db.query(Anomaly).filter(
        Anomaly.id == anomaly_id,
        Anomaly.tenant_id == current_user.tenant_id,
    ).first()

    if not anomaly:
        raise HTTPException(status_code=404, detail="Anomaly not found")

    # Get transaction data for context
    transaction_data = {}
    if anomaly.transaction:
        transaction_data = {
            "amount": str(anomaly.transaction.amount),
            "currency": anomaly.transaction.currency,
            "status": anomaly.transaction.status.value if anomaly.transaction.status else "unknown",
            "failure_reason": anomaly.transaction.failure_reason,
        }

    # Generate AI explanation
    explanation = await get_ai_explanation(
        anomaly.anomaly_type.value,
        anomaly.description,
        transaction_data,
    )

    anomaly.ai_explanation = explanation
    db.commit()

    return {"anomaly_id": str(anomaly_id), "ai_explanation": explanation}
