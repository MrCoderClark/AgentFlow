import uuid
from datetime import datetime

from pydantic import BaseModel


class AgentResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    email: str
    name: str
    role: str
    avatar_url: str | None
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class AgentUpdateRequest(BaseModel):
    name: str | None = None
    avatar_url: str | None = None
    status: str | None = None
