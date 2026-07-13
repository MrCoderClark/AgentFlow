import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.conversation import ConversationStatus, Priority


class ConversationCreate(BaseModel):
    contact_id: uuid.UUID
    subject: str = "New conversation"
    channel: str = "widget"
    priority: Priority = Priority.normal


class ConversationUpdate(BaseModel):
    subject: str | None = None
    status: ConversationStatus | None = None
    priority: Priority | None = None
    assigned_agent_id: uuid.UUID | None = None


class ConversationResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    contact_id: uuid.UUID
    assigned_agent_id: uuid.UUID | None
    subject: str
    status: str
    channel: str
    priority: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
