import uuid
from datetime import datetime

from pydantic import BaseModel


class BotFlowCreate(BaseModel):
    name: str
    flow_data: dict = {}


class BotFlowUpdate(BaseModel):
    name: str | None = None
    flow_data: dict | None = None
    is_active: bool | None = None


class BotFlowResponse(BaseModel):
    id: uuid.UUID
    org_id: uuid.UUID
    name: str
    flow_data: dict
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
