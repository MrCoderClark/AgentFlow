import uuid
from datetime import datetime

from pydantic import BaseModel


class PrivateNoteCreate(BaseModel):
    content: str


class PrivateNoteResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    agent_id: uuid.UUID
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
