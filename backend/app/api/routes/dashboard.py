from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.transaction_service import get_revenue_summary, get_tenant_transactions
from app.services.subscription_service import get_tenant_subscriptions
from app.api.dependencies import get_current_user, get_current_tenant_id
from app.models.user import User
from app.models.transaction import Transaction, TransactionStatus
from sqlalchemy import func
import uuid

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/overview")
def get_overview(
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    revenue = get_revenue_summary(tenant_id, db)
    subscriptions = get_tenant_subscriptions(tenant_id, db)
    recent_transactions = get_tenant_transactions(tenant_id, db, limit=10)

    return {
        "revenue": revenue,
        "subscriptions": {
            "total": len(subscriptions),
            "active": sum(1 for s in subscriptions if s.status.value == "active"),
            "canceled": sum(1 for s in subscriptions if s.status.value == "canceled"),
        },
        "recent_transactions": [
            {
                "id": str(tx.id),
                "amount": float(tx.amount),
                "currency": tx.currency,
                "status": tx.status.value,
                "type": tx.type.value,
                "created_at": tx.created_at.isoformat(),
            }
            for tx in recent_transactions
        ],
        "tenant": {
            "id": str(current_user.tenant_id),
            "user": current_user.full_name or current_user.email,
        }
    }
