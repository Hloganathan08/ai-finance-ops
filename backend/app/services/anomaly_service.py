from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta, timezone
from typing import List, Dict, Optional
from app.models.transaction import Transaction, TransactionStatus
from app.models.anomaly import Anomaly, AnomalyType, AnomalySeverity
import anthropic
from app.core.config import settings


client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)


def detect_anomalies(db: Session, transaction: Transaction) -> List[Dict]:
    """Detect anomalies for a given transaction."""
    anomalies = []
    tenant_id = transaction.tenant_id
    now = datetime.now(timezone.utc)

    # Rule 1: High failure rate for same tenant in last hour
    one_hour_ago = now - timedelta(hours=1)
    recent_failures = db.query(Transaction).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.status == TransactionStatus.FAILED,
        Transaction.created_at >= one_hour_ago,
    ).count()

    if recent_failures >= 3:
        anomalies.append({
            "anomaly_type": AnomalyType.HIGH_FAILURE_RATE,
            "severity": AnomalySeverity.HIGH,
            "description": f"{recent_failures} failed transactions in the last hour",
        })

    # Rule 2: Velocity spike — many transactions in short window
    five_min_ago = now - timedelta(minutes=5)
    recent_count = db.query(Transaction).filter(
        Transaction.tenant_id == tenant_id,
        Transaction.created_at >= five_min_ago,
    ).count()

    if recent_count >= 10:
        anomalies.append({
            "anomaly_type": AnomalyType.VELOCITY_SPIKE,
            "severity": AnomalySeverity.MEDIUM,
            "description": f"{recent_count} transactions in the last 5 minutes",
        })

    # Rule 3: Large transaction (over $1000)
    if float(transaction.amount) >= 1000:
        anomalies.append({
            "anomaly_type": AnomalyType.LARGE_TRANSACTION,
            "severity": AnomalySeverity.LOW,
            "description": f"Large transaction: ${transaction.amount}",
        })

    # Rule 4: Repeated failures for same payment intent
    if transaction.status == TransactionStatus.FAILED and transaction.stripe_payment_intent_id:
        failure_count = db.query(Transaction).filter(
            Transaction.stripe_payment_intent_id == transaction.stripe_payment_intent_id,
            Transaction.status == TransactionStatus.FAILED,
        ).count()

        if failure_count >= 2:
            anomalies.append({
                "anomaly_type": AnomalyType.REPEATED_FAILURES,
                "severity": AnomalySeverity.HIGH,
                "description": f"Payment intent failed {failure_count} times",
            })

    return anomalies


async def get_ai_explanation(anomaly_type: str, description: str, transaction_data: Dict) -> str:
    """Get AI-generated explanation for an anomaly."""
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": f"""You are a payment operations expert. Explain this payment anomaly clearly and concisely.

Anomaly Type: {anomaly_type}
Description: {description}
Transaction Data:
- Amount: ${transaction_data.get('amount', 0)}
- Currency: {transaction_data.get('currency', 'usd')}
- Status: {transaction_data.get('status', 'unknown')}
- Failure Reason: {transaction_data.get('failure_reason', 'none')}

Provide:
1. What this anomaly means
2. Why it likely happened  
3. Recommended action

Keep it under 100 words. Be specific and actionable."""
            }]
        )
        return message.content[0].text
    except Exception as e:
        return f"Unable to generate explanation: {str(e)}"


def create_anomaly_record(
    db: Session,
    tenant_id: str,
    transaction_id: str,
    anomaly_type: AnomalyType,
    severity: AnomalySeverity,
    description: str,
    ai_explanation: Optional[str] = None
) -> Anomaly:
    """Create and save an anomaly record."""
    anomaly = Anomaly(
        tenant_id=tenant_id,
        transaction_id=transaction_id,
        anomaly_type=anomaly_type,
        severity=severity,
        description=description,
        ai_explanation=ai_explanation,
    )
    db.add(anomaly)
    db.commit()
    db.refresh(anomaly)
    return anomaly
