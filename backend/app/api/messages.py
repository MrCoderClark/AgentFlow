import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation, Message, SenderType
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter(prefix="/api/conversations/{conv_id}/messages", tags=["messages"])


@router.get("", response_model=list[MessageResponse])
async def list_messages(
    conv_id: uuid.UUID,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    result = await db.execute(
        select(Message).where(Message.conversation_id == conv_id).order_by(Message.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=MessageResponse, status_code=status.HTTP_201_CREATED)
async def create_message(
    conv_id: uuid.UUID,
    req: MessageCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    msg = Message(
        conversation_id=conv_id,
        sender_type=SenderType.agent,
        sender_id=agent.id,
        content=req.content,
        message_type=req.message_type,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg
