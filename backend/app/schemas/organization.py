import uuid
from datetime import datetime

from pydantic import BaseModel


class OrgResponse(BaseModel):
    id: uuid.UUID
    name: str
    slug: str
    widget_config: dict
    created_at: datetime

    model_config = {"from_attributes": True}


class OrgUpdateRequest(BaseModel):
    name: str | None = None
    widget_config: dict | None = None
