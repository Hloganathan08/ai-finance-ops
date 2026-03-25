from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse
from app.services.ai_service import answer_billing_question
from app.api.dependencies import get_current_user, get_current_tenant_id
from app.models.user import User
import uuid

router = APIRouter(prefix="/ai", tags=["ai"])

@router.post("/query", response_model=AIQueryResponse)
def query_billing_ai(
    data: AIQueryRequest,
    tenant_id: uuid.UUID = Depends(get_current_tenant_id),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        insight = answer_billing_question(data.question, tenant_id, db)
        return AIQueryResponse(success=True, insight=insight)
    except Exception as e:
        return AIQueryResponse(success=False, error=str(e))
