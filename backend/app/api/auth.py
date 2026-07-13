import uuid

import bcrypt
from fastapi import APIRouter, Depends, HTTPException, status
from jose import JWTError, jwt
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from pydantic import BaseModel

from app.api.deps import ALGORITHM, create_access_token, create_refresh_token, require_admin
from app.config import settings
from app.database import get_db
from app.models import Agent, AgentRole, Organization
from app.schemas.auth import (
    InviteRequest,
    LoginRequest,
    RefreshRequest,
    RegisterRequest,
    TokenResponse,
)
from app.services.email import send_invite_email

router = APIRouter(prefix="/api/auth", tags=["auth"])


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


@router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(Organization).where(Organization.slug == req.org_slug))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Organization slug taken")

    org = Organization(name=req.org_name, slug=req.org_slug)
    db.add(org)
    await db.flush()

    agent = Agent(
        org_id=org.id,
        email=req.email,
        password_hash=hash_password(req.password),
        name=req.name,
        role=AgentRole.admin,
        is_verified=True,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    return TokenResponse(
        access_token=create_access_token(agent.id, org.id),
        refresh_token=create_refresh_token(agent.id, org.id),
    )


@router.post("/login", response_model=TokenResponse)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    org_result = await db.execute(select(Organization).where(Organization.slug == req.org_slug))
    org = org_result.scalar_one_or_none()
    if not org:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    agent_result = await db.execute(
        select(Agent).where(Agent.org_id == org.id, Agent.email == req.email)
    )
    agent = agent_result.scalar_one_or_none()
    if not agent or not verify_password(req.password, agent.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    return TokenResponse(
        access_token=create_access_token(agent.id, org.id),
        refresh_token=create_refresh_token(agent.id, org.id),
    )


@router.post("/refresh", response_model=TokenResponse)
async def refresh(req: RefreshRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.refresh_token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token type")
        agent_id = uuid.UUID(payload["sub"])
        org_id = uuid.UUID(payload["org"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Agent not found")

    return TokenResponse(
        access_token=create_access_token(agent_id, org_id),
        refresh_token=create_refresh_token(agent_id, org_id),
    )


class AcceptInviteRequest(BaseModel):
    token: str
    password: str


@router.post("/invite")
async def invite_agent(
    req: InviteRequest,
    admin: Agent = Depends(require_admin),
    db: AsyncSession = Depends(get_db),
):
    existing = await db.execute(
        select(Agent).where(Agent.org_id == admin.org_id, Agent.email == req.email)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Agent already exists")

    agent = Agent(
        org_id=admin.org_id,
        email=req.email,
        password_hash="",
        name=req.name,
        role=req.role,
        is_verified=False,
    )
    db.add(agent)
    await db.commit()
    await db.refresh(agent)

    invite_token = create_access_token(agent.id, admin.org_id)
    org_result = await db.execute(select(Organization).where(Organization.id == admin.org_id))
    org = org_result.scalar_one()
    await send_invite_email(req.email, org.name, invite_token)

    return {"message": "Invite sent"}


@router.post("/accept-invite", response_model=TokenResponse)
async def accept_invite(req: AcceptInviteRequest, db: AsyncSession = Depends(get_db)):
    try:
        payload = jwt.decode(req.token, settings.JWT_SECRET, algorithms=[ALGORITHM])
        agent_id = uuid.UUID(payload["sub"])
        org_id = uuid.UUID(payload["org"])
    except (JWTError, ValueError):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid invite token")

    result = await db.execute(select(Agent).where(Agent.id == agent_id))
    agent = result.scalar_one_or_none()
    if not agent or agent.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid or already used invite")

    agent.password_hash = hash_password(req.password)
    agent.is_verified = True
    await db.commit()

    return TokenResponse(
        access_token=create_access_token(agent.id, org_id),
        refresh_token=create_refresh_token(agent.id, org_id),
    )
