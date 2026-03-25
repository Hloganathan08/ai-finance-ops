from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User, UserRole
from app.models.tenant import Tenant
from app.schemas.user import UserCreate
from app.schemas.tenant import TenantCreate
from app.core.security import hash_password, verify_password, create_access_token
import uuid

def register_tenant_and_owner(
    tenant_data: TenantCreate,
    user_data: UserCreate,
    db: Session
):
    # Check if tenant slug already exists
    existing_tenant = db.query(Tenant).filter(Tenant.slug == tenant_data.slug).first()
    if existing_tenant:
        raise HTTPException(status_code=400, detail="Tenant slug already taken")

    # Check if email already exists
    existing_email = db.query(Tenant).filter(Tenant.email == tenant_data.email).first()
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")

    # Create tenant
    tenant = Tenant(
        id=uuid.uuid4(),
        name=tenant_data.name,
        slug=tenant_data.slug,
        email=tenant_data.email,
    )
    db.add(tenant)
    db.flush()

    # Create owner user
    user = User(
        id=uuid.uuid4(),
        tenant_id=tenant.id,
        email=user_data.email,
        hashed_password=hash_password(user_data.password),
        full_name=user_data.full_name,
        role=UserRole.OWNER,
    )
    db.add(user)
    db.commit()
    db.refresh(tenant)
    db.refresh(user)

    token = create_access_token(data={
        "sub": str(user.id),
        "tenant_id": str(tenant.id),
        "role": user.role.value
    })

    return {"tenant": tenant, "user": user, "access_token": token}


def login_user(email: str, password: str, db: Session):
    user = db.query(User).filter(User.email == email).first()
    if not user or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is disabled")

    token = create_access_token(data={
        "sub": str(user.id),
        "tenant_id": str(user.tenant_id),
        "role": user.role.value
    })
    return {"access_token": token, "token_type": "bearer"}
