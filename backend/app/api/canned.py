import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, CannedResponse
from app.schemas.canned import CannedResponseCreate, CannedResponseSchema, CannedResponseUpdate

router = APIRouter(prefix="/api/canned", tags=["canned"])


@router.get("", response_model=list[CannedResponseSchema])
async def list_canned(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(CannedResponse).where(CannedResponse.org_id == agent.org_id))
    return result.scalars().all()


@router.post("", response_model=CannedResponseSchema, status_code=status.HTTP_201_CREATED)
async def create_canned(
    req: CannedResponseCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    cr = CannedResponse(org_id=agent.org_id, **req.model_dump())
    db.add(cr)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.put("/{canned_id}", response_model=CannedResponseSchema)
async def update_canned(
    canned_id: uuid.UUID, req: CannedResponseUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(CannedResponse.id == canned_id, CannedResponse.org_id == agent.org_id)
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(cr, k, v)
    await db.commit()
    await db.refresh(cr)
    return cr


@router.delete("/{canned_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_canned(
    canned_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(CannedResponse).where(CannedResponse.id == canned_id, CannedResponse.org_id == agent.org_id)
    )
    cr = result.scalar_one_or_none()
    if not cr:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(cr)
    await db.commit()
