import redis
import json
from typing import Dict, Any
from app.core.config import settings

redis_client = redis.from_url(settings.REDIS_URL)

CHANNEL = "dashboard:updates"


def publish_event(event_type: str, data: Dict[str, Any]) -> None:
    """Publish an event to the dashboard channel."""
    message = json.dumps({
        "type": event_type,
        "data": data,
    })
    redis_client.publish(CHANNEL, message)


def publish_new_transaction(transaction_data: Dict[str, Any]) -> None:
    """Broadcast a new transaction to all connected clients."""
    publish_event("new_transaction", transaction_data)


def publish_new_anomaly(anomaly_data: Dict[str, Any]) -> None:
    """Broadcast a new anomaly to all connected clients."""
    publish_event("new_anomaly", anomaly_data)


def publish_stats_update(stats: Dict[str, Any]) -> None:
    """Broadcast updated stats to all connected clients."""
    publish_event("stats_update", stats)
