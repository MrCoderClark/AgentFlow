import uuid
from datetime import datetime

from pydantic import BaseModel


class KnowledgeArticleCreate(BaseModel):
    title: str
    content: str


class KnowledgeArticleUpdate(BaseModel):
    title: str | None = None
    content: str | None = None


class KnowledgeArticleResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    title: str
    content: str
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
