import uuid
from datetime import datetime

from pydantic import BaseModel

from app.models.org_api_key import LLMProviderEnum


class ApiKeyCreate(BaseModel):
    provider: LLMProviderEnum
    api_key: str


class ApiKeyResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    provider: str
    created_at: datetime

    model_config = {"from_attributes": True}
