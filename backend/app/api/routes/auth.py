from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.user import UserCreate, UserResponse, Token, LoginRequest
from app.schemas.tenant import TenantCreate, TenantResponse
from app.services.auth_service import register_tenant_and_owner, login_user
from pydantic import BaseModel

router = APIRouter(prefix="/auth", tags=["auth"])

class RegisterRequest(BaseModel):
    tenant: TenantCreate
    user: UserCreate

class RegisterResponse(BaseModel):
    tenant: TenantResponse
    user: UserResponse
    access_token: str
    token_type: str = "bearer"

@router.post("/register", response_model=RegisterResponse)
def register(data: RegisterRequest, db: Session = Depends(get_db)):
    result = register_tenant_and_owner(data.tenant, data.user, db)
    return RegisterResponse(
        tenant=TenantResponse.model_validate(result["tenant"]),
        user=UserResponse.model_validate(result["user"]),
        access_token=result["access_token"],
    )

@router.post("/login", response_model=Token)
def login(data: LoginRequest, db: Session = Depends(get_db)):
    return login_user(data.email, data.password, db)
