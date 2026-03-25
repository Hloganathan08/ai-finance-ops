from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.db.database import get_db
from app.schemas.plan import PlanCreate, PlanResponse
from app.services.plan_service import create_plan, get_all_plans, get_plan_by_id
from app.api.dependencies import get_current_user
from app.models.user import User
import uuid

router = APIRouter(prefix="/plans", tags=["plans"])

@router.get("", response_model=List[PlanResponse])
def list_plans(db: Session = Depends(get_db)):
    return get_all_plans(db)

@router.get("/{plan_id}", response_model=PlanResponse)
def get_plan(plan_id: uuid.UUID, db: Session = Depends(get_db)):
    return get_plan_by_id(plan_id, db)

@router.post("", response_model=PlanResponse)
def create_new_plan(
    data: PlanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    return create_plan(data, db)
