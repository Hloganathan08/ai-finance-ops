from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole
import uuid

security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    user = db.query(User).filter(User.id == uuid.UUID(payload["sub"])).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def get_current_tenant_id(current_user: User = Depends(get_current_user)) -> uuid.UUID:
    return current_user.tenant_id

def require_owner(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.OWNER:
        raise HTTPException(status_code=403, detail="Owner access required")
    return current_user
