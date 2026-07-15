from unittest.mock import AsyncMock, patch

from httpx import AsyncClient

MOCK_EMAIL = "app.api.auth.send_verification_email"
MOCK_INVITE = "app.api.auth.send_invite_email"


async def register_verified(client, slug, email="admin@test.com", password="pass12345", name="Admin"):
    """Register and verify in one shot (mocks email)."""
    with patch(MOCK_EMAIL, new_callable=AsyncMock) as mock:
        resp = await client.post("/api/auth/register", json={
            "org_name": f"{slug} Co",
            "org_slug": slug,
            "email": email,
            "password": password,
            "name": name,
        })
        assert resp.status_code == 201
        token = mock.call_args[0][1]
    verified = await client.post("/api/auth/verify-email", json={"token": token})
    return verified.json()["access_token"]


@patch(MOCK_EMAIL, new_callable=AsyncMock)
async def test_register(mock_email, client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "org_name": "Acme Corp",
        "org_slug": "acme-corp",
        "email": "founder@acme.com",
        "password": "securepass123",
        "name": "Jane Founder",
    })
    assert resp.status_code == 201
    assert resp.json()["message"] == "Check your email to verify your account"
    mock_email.assert_called_once()


@patch(MOCK_EMAIL, new_callable=AsyncMock)
async def test_register_duplicate_slug(mock_email, client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Dup Corp",
        "org_slug": "dup-corp",
        "email": "a@dup.com",
        "password": "pass123",
        "name": "A",
    })
    resp = await client.post("/api/auth/register", json={
        "org_name": "Dup Corp 2",
        "org_slug": "dup-corp",
        "email": "b@dup.com",
        "password": "pass123",
        "name": "B",
    })
    assert resp.status_code == 409


@patch(MOCK_EMAIL, new_callable=AsyncMock)
async def test_verify_email(mock_email, client: AsyncClient):
    resp = await client.post("/api/auth/register", json={
        "org_name": "Verify Co",
        "org_slug": "verify-co",
        "email": "user@verify.com",
        "password": "pass12345",
        "name": "User",
    })
    assert resp.status_code == 201

    token = mock_email.call_args[0][1]
    resp = await client.post("/api/auth/verify-email", json={"token": token})
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login(client: AsyncClient):
    token = await register_verified(client, "login-co", "user@login.com", "pass12345", "User")
    assert token

    resp = await client.post("/api/auth/login", json={
        "email": "user@login.com",
        "password": "pass12345",
        "org_slug": "login-co",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_login_wrong_password(client: AsyncClient):
    await register_verified(client, "wrong-co", "user@wrong.com", "rightpass1", "User")

    resp = await client.post("/api/auth/login", json={
        "email": "user@wrong.com",
        "password": "wrongpass",
        "org_slug": "wrong-co",
    })
    assert resp.status_code == 401


@patch(MOCK_EMAIL, new_callable=AsyncMock)
async def test_login_unverified(mock_email, client: AsyncClient):
    await client.post("/api/auth/register", json={
        "org_name": "Unverified Co",
        "org_slug": "unverified-co",
        "email": "user@unverified.com",
        "password": "pass12345",
        "name": "User",
    })
    resp = await client.post("/api/auth/login", json={
        "email": "user@unverified.com",
        "password": "pass12345",
        "org_slug": "unverified-co",
    })
    assert resp.status_code == 403
    assert "verify" in resp.json()["detail"].lower()


@patch(MOCK_INVITE, new_callable=AsyncMock)
async def test_invite_agent(mock_email, client: AsyncClient):
    token = await register_verified(client, "invite-co", "admin@invite.com")

    resp = await client.post(
        "/api/auth/invite",
        json={"email": "agent@invite.com", "name": "Agent", "role": "agent"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert resp.status_code == 200
    assert resp.json()["message"] == "Invite sent"
    mock_email.assert_called_once()


@patch(MOCK_INVITE, new_callable=AsyncMock)
async def test_accept_invite(mock_email, client: AsyncClient):
    token = await register_verified(client, "accept-co", "admin@accept.com")

    await client.post(
        "/api/auth/invite",
        json={"email": "newagent@accept.com", "name": "New Agent", "role": "agent"},
        headers={"Authorization": f"Bearer {token}"},
    )

    invite_token = mock_email.call_args[0][2]
    resp = await client.post("/api/auth/accept-invite", json={
        "token": invite_token,
        "password": "newpass123",
    })
    assert resp.status_code == 200
    assert "access_token" in resp.json()


async def test_list_agents(client: AsyncClient):
    token = await register_verified(client, "list-co", "admin@list.com")

    resp = await client.get("/api/auth/agents", headers={"Authorization": f"Bearer {token}"})
    assert resp.status_code == 200
    agents = resp.json()
    assert len(agents) == 1
    assert agents[0]["email"] == "admin@list.com"
