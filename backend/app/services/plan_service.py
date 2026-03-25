from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.plan import Plan
from app.schemas.plan import PlanCreate
from typing import List
import uuid

def create_plan(data: PlanCreate, db: Session) -> Plan:
    plan = Plan(
        id=uuid.uuid4(),
        name=data.name,
        description=data.description,
        price=data.price,
        currency=data.currency,
        interval=data.interval,
        max_users=data.max_users,
    )
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan

def get_all_plans(db: Session) -> List[Plan]:
    return db.query(Plan).filter(Plan.is_active == True).all()

def get_plan_by_id(plan_id: uuid.UUID, db: Session) -> Plan:
    plan = db.query(Plan).filter(Plan.id == plan_id).first()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan

def deactivate_plan(plan_id: uuid.UUID, db: Session) -> Plan:
    plan = get_plan_by_id(plan_id, db)
    plan.is_active = False
    db.commit()
    db.refresh(plan)
    return plan
