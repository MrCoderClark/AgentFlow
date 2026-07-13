import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent
from app.database import get_db
from app.models import Agent, BotFlow
from app.schemas.bot_flow import BotFlowCreate, BotFlowResponse, BotFlowUpdate

router = APIRouter(prefix="/api/flows", tags=["bot_flows"])


@router.get("", response_model=list[BotFlowResponse])
async def list_flows(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(BotFlow).where(BotFlow.org_id == agent.org_id))
    return result.scalars().all()


@router.post("", response_model=BotFlowResponse, status_code=status.HTTP_201_CREATED)
async def create_flow(
    req: BotFlowCreate, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    flow = BotFlow(org_id=agent.org_id, **req.model_dump())
    db.add(flow)
    await db.commit()
    await db.refresh(flow)
    return flow


@router.get("/{flow_id}", response_model=BotFlowResponse)
async def get_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    return flow


@router.put("/{flow_id}", response_model=BotFlowResponse)
async def update_flow(
    flow_id: uuid.UUID, req: BotFlowUpdate,
    agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(flow, k, v)
    await db.commit()
    await db.refresh(flow)
    return flow


@router.post("/{flow_id}/activate", response_model=BotFlowResponse)
async def activate_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    await db.execute(
        update(BotFlow).where(BotFlow.org_id == agent.org_id).values(is_active=False)
    )
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    flow.is_active = True
    await db.commit()
    await db.refresh(flow)
    return flow


@router.delete("/{flow_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_flow(
    flow_id: uuid.UUID, agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(BotFlow).where(BotFlow.id == flow_id, BotFlow.org_id == agent.org_id))
    flow = result.scalar_one_or_none()
    if not flow:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(flow)
    await db.commit()
