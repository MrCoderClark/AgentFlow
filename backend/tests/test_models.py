import pytest
from httpx import AsyncClient
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Agent, Organization


@pytest.mark.asyncio
async def test_health(client: AsyncClient):
    r = await client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


@pytest.mark.asyncio
async def test_org_and_agent_created(
    db_session: AsyncSession, test_org: Organization, test_agent: Agent
):
    assert test_org.slug == "test-corp"
    assert test_agent.org_id == test_org.id
    assert test_agent.email == "agent@test.com"
