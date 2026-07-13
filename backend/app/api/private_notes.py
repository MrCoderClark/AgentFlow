import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, Conversation, PrivateNote
from app.schemas.private_note import PrivateNoteCreate, PrivateNoteResponse

router = APIRouter(prefix="/api/conversations/{conv_id}/notes", tags=["private_notes"])


@router.get("", response_model=list[PrivateNoteResponse])
async def list_notes(
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
        select(PrivateNote).where(PrivateNote.conversation_id == conv_id).order_by(PrivateNote.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=PrivateNoteResponse, status_code=status.HTTP_201_CREATED)
async def create_note(
    conv_id: uuid.UUID,
    req: PrivateNoteCreate,
    agent: Agent = Depends(get_current_agent),
    db: AsyncSession = Depends(get_db),
):
    conv = await db.execute(
        select(Conversation).where(Conversation.id == conv_id, Conversation.org_id == agent.org_id)
    )
    if not conv.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Conversation not found")

    note = PrivateNote(conversation_id=conv_id, agent_id=agent.id, content=req.content)
    db.add(note)
    await db.commit()
    await db.refresh(note)
    return note
