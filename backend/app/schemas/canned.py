import uuid

from pydantic import BaseModel


class CannedResponseCreate(BaseModel):
    shortcode: str
    content: str


class CannedResponseUpdate(BaseModel):
    shortcode: str | None = None
    content: str | None = None


class CannedResponseSchema(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    shortcode: str
    content: str

    model_config = {"from_attributes": True}
