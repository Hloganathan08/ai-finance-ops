from pydantic import BaseModel, EmailStr
from uuid import UUID
from datetime import datetime
from typing import Optional

class TenantCreate(BaseModel):
    name: str
    slug: str
    email: EmailStr

class TenantResponse(BaseModel):
    id: UUID
    name: str
    slug: str
    email: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
