import enum
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ConversationStatus(str, enum.Enum):
    open = "open"
    pending = "pending"
    resolved = "resolved"
    closed = "closed"


class Priority(str, enum.Enum):
    low = "low"
    normal = "normal"
    high = "high"
    urgent = "urgent"


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    contact_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("contacts.id"))
    assigned_agent_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("agents.id"), nullable=True)
    subject: Mapped[str] = mapped_column(String(500), default="New conversation")
    status: Mapped[ConversationStatus] = mapped_column(Enum(ConversationStatus), default=ConversationStatus.open)
    channel: Mapped[str] = mapped_column(String(50), default="widget")
    priority: Mapped[Priority] = mapped_column(Enum(Priority), default=Priority.normal)
    flow_state: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    organization = relationship("Organization", back_populates="conversations")
    contact = relationship("Contact", back_populates="conversations")
    assigned_agent = relationship("Agent", foreign_keys=[assigned_agent_id])
    messages = relationship("Message", back_populates="conversation", order_by="Message.created_at")
    private_notes = relationship("PrivateNote", back_populates="conversation")
