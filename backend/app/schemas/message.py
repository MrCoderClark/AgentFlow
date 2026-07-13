import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.message import MessageType, SenderType


class MessageCreate(BaseModel):
    content: str
    message_type: MessageType = MessageType.text


class MessageResponse(BaseModel):
    id: uuid.UUID
    conversation_id: uuid.UUID
    sender_type: str
    sender_id: uuid.UUID
    content: str
    message_type: str
    created_at: datetime

    model_config = {"from_attributes": True}
