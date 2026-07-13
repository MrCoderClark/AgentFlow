import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class SenderType(str, enum.Enum):
    contact = "contact"
    agent = "agent"
    bot = "bot"


class MessageType(str, enum.Enum):
    text = "text"
    image = "image"
    system = "system"


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    conversation_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("conversations.id"), index=True)
    sender_type: Mapped[SenderType] = mapped_column(Enum(SenderType))
    sender_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True))
    content: Mapped[str] = mapped_column(Text)
    message_type: Mapped[MessageType] = mapped_column(Enum(MessageType), default=MessageType.text)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    conversation = relationship("Conversation", back_populates="messages")
