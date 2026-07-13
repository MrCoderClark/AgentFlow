import uuid
from datetime import datetime

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Organization(Base):
    __tablename__ = "organizations"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255))
    slug: Mapped[str] = mapped_column(String(100), unique=True, index=True)
    widget_config: Mapped[dict] = mapped_column(JSONB, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    agents = relationship("Agent", back_populates="organization")
    contacts = relationship("Contact", back_populates="organization")
    conversations = relationship("Conversation", back_populates="organization")
    bot_flows = relationship("BotFlow", back_populates="organization")
    knowledge_articles = relationship("KnowledgeArticle", back_populates="organization")
    canned_responses = relationship("CannedResponse", back_populates="organization")
    api_keys = relationship("OrgApiKey", back_populates="organization")
