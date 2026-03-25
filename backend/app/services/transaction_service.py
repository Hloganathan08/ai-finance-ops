from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.audit_log import AuditLog
from typing import List
import uuid
import json

def get_tenant_transactions(
    tenant_id: uuid.UUID,
    db: Session,
    limit: int = 50,
    offset: int = 0
) -> List[Transaction]:
    return (
        db.query(Transaction)
        .filter(Transaction.tenant_id == tenant_id)
        .order_by(Transaction.created_at.desc())
        .limit(limit)
        .offset(offset)
        .all()
    )

def get_transaction_by_id(
    transaction_id: uuid.UUID,
    tenant_id: uuid.UUID,
    db: Session
) -> Transaction:
    tx = db.query(Transaction).filter(
        Transaction.id == transaction_id,
        Transaction.tenant_id == tenant_id
    ).first()
    if not tx:
        raise HTTPException(status_code=404, detail="Transaction not found")
    return tx

def process_refund(
    transaction_id: uuid.UUID,
    tenant_id: uuid.UUID,
    reason: str,
    db: Session
) -> Transaction:
    tx = get_transaction_by_id(transaction_id, tenant_id, db)

    if tx.status != TransactionStatus.SUCCEEDED:
        raise HTTPException(status_code=400, detail="Only succeeded transactions can be refunded")

    old_status = tx.status.value
    tx.status = TransactionStatus.REFUNDED

    # Create refund transaction record
    refund_tx = Transaction(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        subscription_id=tx.subscription_id,
        amount=tx.amount,
        currency=tx.currency,
        status=TransactionStatus.SUCCEEDED,
        type=TransactionType.REFUND,
        idempotency_key=str(uuid.uuid4()),
    )
    db.add(refund_tx)

    audit = AuditLog(
        id=uuid.uuid4(),
        tenant_id=tenant_id,
        action="transaction.refunded",
        resource_type="transaction",
        resource_id=str(transaction_id),
        old_value=json.dumps({"status": old_status}),
        new_value=json.dumps({"status": "refunded", "reason": reason}),
    )
    db.add(audit)
    db.commit()
    db.refresh(tx)
    return tx

def get_revenue_summary(tenant_id: uuid.UUID, db: Session) -> dict:
    from sqlalchemy import func
    from app.models.transaction import TransactionStatus, TransactionType

    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.status == TransactionStatus.SUCCEEDED,
        Transaction.type == TransactionType.PAYMENT
    ).scalar() or 0

    total_refunds = db.query(func.sum(Transaction.amount)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.type == TransactionType.REFUND
    ).scalar() or 0

    failed_count = db.query(func.count(Transaction.id)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.status == TransactionStatus.FAILED
    ).scalar() or 0

    total_count = db.query(func.count(Transaction.id)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.type == TransactionType.PAYMENT
    ).scalar() or 0

    return {
        "total_revenue": float(total_revenue),
        "total_refunds": float(total_refunds),
        "net_revenue": float(total_revenue - total_refunds),
        "failed_payments": failed_count,
        "total_payments": total_count,
        "success_rate": round((total_count - failed_count) / total_count * 100, 2) if total_count > 0 else 0
    }
