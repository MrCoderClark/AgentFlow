import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation
from app.schemas.conversation import ConversationCreate, ConversationResponse, ConversationUpdate

router = APIRouter(prefix="/api/conversations", tags=["conversations"])


@router.get("", response_model=list[ConversationResponse])
async def list_conversations(
    status_filter: str | None = None,
    assigned_to_me: bool = False,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    q = select(Conversation).where(Conversation.org_id == agent.org_id).order_by(Conversation.updated_at.desc())
    if status_filter:
        q = q.where(Conversation.status == status_filter)
    if assigned_to_me:
        q = q.where(Conversation.assigned_agent_id == agent.id)
    result = await db.execute(q)
    return result.scalars().all()


@router.post("", response_model=ConversationResponse, status_code=status.HTTP_201_CREATED)
async def create_conversation(
    req: ConversationCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = Conversation(org_id=agent.org_id, **req.model_dump())
    db.add(conv)
    await db.commit()
    await db.refresh(conv)
    return conv


@router.get("/{conv_id}", response_model=ConversationResponse)
async def get_conversation(
    conv_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    return conv


@router.put("/{conv_id}", response_model=ConversationResponse)
async def update_conversation(
    conv_id: uuid.UUID,
    req: ConversationUpdate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    conv = result.scalar_one_or_none()
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(conv, k, v)
    await db.commit()
    await db.refresh(conv)
    return conv
