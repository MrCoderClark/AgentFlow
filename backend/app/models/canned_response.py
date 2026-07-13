import uuid

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class CannedResponse(Base):
    __tablename__ = "canned_responses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    org_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("organizations.id"), index=True)
    shortcode: Mapped[str] = mapped_column(String(100))
    content: Mapped[str] = mapped_column(Text)

    organization = relationship("Organization", back_populates="canned_responses")
