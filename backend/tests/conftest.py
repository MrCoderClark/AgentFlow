import uuid
from collections.abc import AsyncGenerator

import pytest_asyncio
from httpx import ASGITransport, AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import settings
from app.database import Base, get_db
from app.main import app
from app.models import Agent, AgentRole, AgentStatus, Organization

TEST_DB_URL = settings.DATABASE_URL.replace("/customer_support", "/customer_support_test")


@pytest_asyncio.fixture(autouse=True)
async def db_session() -> AsyncGenerator[AsyncSession]:
    engine = create_async_engine(TEST_DB_URL)
    session_factory = async_sessionmaker(engine, expire_on_commit=False)

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with session_factory() as session:
        async def _override():
            yield session

        app.dependency_overrides[get_db] = _override
        yield session

    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

    await engine.dispose()
    app.dependency_overrides.clear()


@pytest_asyncio.fixture
async def test_org(db_session: AsyncSession) -> Organization:
    org = Organization(
        id=uuid.uuid4(),
        name="Test Corp",
        slug="test-corp",
        widget_config={"color": "#000"},
    )
    db_session.add(org)
    await db_session.commit()
    await db_session.refresh(org)
    return org


@pytest_asyncio.fixture
async def test_agent(db_session: AsyncSession, test_org: Organization) -> Agent:
    agent = Agent(
        id=uuid.uuid4(),
        org_id=test_org.id,
        email="agent@test.com",
        password_hash="hashed",
        name="Test Agent",
        role=AgentRole.admin,
        status=AgentStatus.online,
        is_verified=True,
    )
    db_session.add(agent)
    await db_session.commit()
    await db_session.refresh(agent)
    return agent


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient]:
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c
