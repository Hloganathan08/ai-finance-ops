from sqlalchemy.orm import Session
from anthropic import Anthropic
from app.core.config import settings
from app.models.transaction import Transaction, TransactionStatus, TransactionType
from app.models.subscription import Subscription, SubscriptionStatus
from app.schemas.ai import AIInsight
import uuid
import json

client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

def get_billing_context(tenant_id: uuid.UUID, db: Session) -> dict:
    from sqlalchemy import func
    from app.models.transaction import Transaction

    transactions = (
        db.query(Transaction)
        .filter(Transaction.tenant_id == tenant_id)
        .order_by(Transaction.created_at.desc())
        .limit(100)
        .all()
    )

    subscriptions = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id
    ).all()

    total_revenue = db.query(func.sum(Transaction.amount)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.status == TransactionStatus.SUCCEEDED,
        Transaction.type == TransactionType.PAYMENT
    ).scalar() or 0

    failed_count = db.query(func.count(Transaction.id)).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.status == TransactionStatus.FAILED
    ).scalar() or 0

    tx_data = [
        {
            "id": str(tx.id),
            "amount": float(tx.amount),
            "currency": tx.currency,
            "status": tx.status.value,
            "type": tx.type.value,
            "created_at": tx.created_at.isoformat(),
            "failure_reason": tx.failure_reason,
        }
        for tx in transactions
    ]

    return {
        "total_revenue": float(total_revenue),
        "failed_payments": failed_count,
        "active_subscriptions": sum(1 for s in subscriptions if s.status == SubscriptionStatus.ACTIVE),
        "recent_transactions": tx_data,
    }


def answer_billing_question(
    question: str,
    tenant_id: uuid.UUID,
    db: Session
) -> AIInsight:
    context = get_billing_context(tenant_id, db)

    prompt = f"""You are a billing intelligence assistant for a SaaS platform.
You have access to the following billing data for this tenant:

Total Revenue: ${context['total_revenue']}
Failed Payments: {context['failed_payments']}
Active Subscriptions: {context['active_subscriptions']}
Recent Transactions (last 100):
{json.dumps(context['recent_transactions'], indent=2)}

The user asks: {question}

Respond with a JSON object in this exact format:
{{
  "answer": "clear plain-English answer to the question",
  "data_points": [
    {{"label": "metric name", "value": "metric value"}}
  ],
  "anomalies": ["list any unusual patterns or anomalies you notice, or empty list"]
}}

Only return the JSON object, nothing else."""

    message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=1000,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError:
        parsed = {
            "answer": raw,
            "data_points": [],
            "anomalies": []
        }

    return AIInsight(
        question=question,
        answer=parsed.get("answer", ""),
        data_points=parsed.get("data_points", []),
        anomalies=parsed.get("anomalies", [])
    )
