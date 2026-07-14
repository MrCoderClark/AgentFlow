import uuid
from datetime import datetime

from pydantic import BaseModel


class ContactCreate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    locale: str | None = None
    metadata_: dict = {}
    tags: list[str] = []


class ContactUpdate(BaseModel):
    name: str | None = None
    email: str | None = None
    phone: str | None = None
    locale: str | None = None
    metadata_: dict | None = None
    tags: list[str] | None = None


class ContactResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str | None
    email: str | None
    phone: str | None
    locale: str | None
    metadata_: dict
    tags: list[str]
    created_at: datetime

    model_config = {"from_attributes": True}
