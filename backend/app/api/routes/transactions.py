from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.transaction import TransactionResponse, RefundRequest
from app.services.transaction_service import (
    get_tenant_transactions,
    get_transaction_by_id,
    process_refund,
    get_revenue_summary
)
from app.api.dependencies import get_current_user, get_current_tenant_id
from app.models.user import User
import uuid

router = APIRouter(prefix="/transactions", tags=["transactions"])

@router.get("", response_model=List[TransactionResponse])
def list_transactions(
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_tenant_transactions(tenant_id, db, limit, offset)

@router.get("/summary")
def revenue_summary(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_revenue_summary(tenant_id, db)

@router.get("/{transaction_id}", response_model=TransactionResponse)
def get_transaction(
    transaction_id: uuid.UUID,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return get_transaction_by_id(transaction_id, tenant_id, db)

@router.post("/refund", response_model=TransactionResponse)
def refund_transaction(
    data: RefundRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return process_refund(data.transaction_id, tenant_id, data.reason or "", db)
