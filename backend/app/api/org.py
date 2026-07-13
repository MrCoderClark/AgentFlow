import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_agent, require_admin
from app.database import get_db
from app.models import Agent, Organization, OrgApiKey
from app.schemas.org_api_key import ApiKeyCreate, ApiKeyResponse
from app.schemas.organization import OrgResponse, OrgUpdateRequest
from app.services.encryption import encrypt

router = APIRouter(prefix="/api/org", tags=["organization"])


@router.get("", response_model=OrgResponse)
async def get_org(agent: Agent = Depends(get_current_agent), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Organization).where(Organization.id == agent.org_id))
    return result.scalar_one()


@router.put("", response_model=OrgResponse)
async def update_org(
    req: OrgUpdateRequest,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Organization).where(Organization.id == agent.org_id))
    org = result.scalar_one()
    for k, v in req.model_dump(exclude_unset=True).items():
        setattr(org, k, v)
    await db.commit()
    await db.refresh(org)
    return org


@router.get("/api-keys", response_model=list[ApiKeyResponse])
async def list_api_keys(agent: Agent = Depends(require_admin), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(OrgApiKey).where(OrgApiKey.org_id == agent.org_id))
    return result.scalars().all()


@router.post("/api-keys", response_model=ApiKeyResponse, status_code=status.HTTP_201_CREATED)
async def create_api_key(
    req: ApiKeyCreate,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(OrgApiKey).where(OrgApiKey.org_id == agent.org_id, OrgApiKey.provider == req.provider)
    )
    old = existing.scalar_one_or_none()
    if old:
        await db.delete(old)

    key = OrgApiKey(org_id=agent.org_id, provider=req.provider, encrypted_key=encrypt(req.api_key))
    db.add(key)
    await db.commit()
    await db.refresh(key)
    return key


@router.delete("/api-keys/{key_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_api_key(
    key_id: uuid.UUID,
    agent: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(OrgApiKey).where(OrgApiKey.id == key_id, OrgApiKey.org_id == agent.org_id)
    )
    key = result.scalar_one_or_none()
    if not key:
        raise HTTPException(status_code=404, detail="Not found")
    await db.delete(key)
    await db.commit()
